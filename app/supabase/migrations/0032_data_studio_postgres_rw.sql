-- PostgreSQL Data Studio: controlled read/write operations for internal admins.
--
-- Design:
--   * Raw SQL console remains read-only and continues to use run_sql_editor_query.
--   * Writes go through run_data_studio_mutation, which only targets explicitly
--     configured tables and only permits INSERT / UPDATE / DELETE.
--   * The mutation function is SECURITY INVOKER so the target table's normal RLS
--     policies still apply. It also enforces the selected org/client scope itself.
--   * Every successful write is captured in an immutable mutation log with the
--     before/after row images.
--   * DDL is intentionally excluded from the browser. Schema changes stay in
--     reviewed migrations.

create table if not exists public.data_studio_table_config (
  table_name text primary key,
  label text not null,
  primary_key_columns text[] not null default array['id']::text[],
  org_scope_column text,
  client_scope_column text,
  allow_read boolean not null default true,
  allow_insert boolean not null default false,
  allow_update boolean not null default false,
  allow_delete boolean not null default false,
  protected_columns text[] not null default array[
    'id', 'org_id', 'created_by', 'created_at', 'updated_at'
  ]::text[],
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.data_studio_table_config enable row level security;

create policy "org admins can view data studio table config"
  on public.data_studio_table_config for select
  to authenticated
  using (
    exists (
      select 1
      from public.org_members om
      where om.user_id = auth.uid()
        and om.role in ('owner', 'admin')
    )
  );

revoke all on table public.data_studio_table_config from anon;
grant select on table public.data_studio_table_config to authenticated;

insert into public.data_studio_table_config
  (table_name, label, primary_key_columns, org_scope_column, client_scope_column,
   allow_read, allow_insert, allow_update, allow_delete, sort_order)
values
  ('clients', 'Clients', array['id'], 'org_id', 'id', true, true, true, true, 10),
  ('projects', 'Projects', array['id'], 'org_id', 'client_id', true, true, true, true, 20),
  ('data_sources', 'Data Sources', array['id'], 'org_id', 'client_id', true, true, true, true, 30),
  ('client_contracts', 'Client Contracts', array['id'], 'org_id', 'client_id', true, true, true, true, 40),
  ('time_entries', 'Time Entries', array['id'], 'org_id', 'client_id', true, true, true, true, 50),
  ('timecards', 'Timecards', array['id'], 'org_id', 'client_id', true, true, true, true, 60),
  ('invoices', 'Invoices', array['id'], 'org_id', 'client_id', true, true, true, true, 70),
  ('invoice_line_items', 'Invoice Line Items', array['id'], 'org_id', null, true, true, true, true, 80),
  ('pipelines', 'Pipelines', array['id'], 'org_id', null, true, true, true, true, 90),
  ('pipeline_runs', 'Pipeline Runs', array['id'], 'org_id', null, true, false, false, false, 100),
  ('docs', 'Documents', array['id'], 'org_id', null, true, true, true, true, 110),
  ('agreement_templates', 'Agreement Templates', array['id'], 'org_id', null, true, true, true, true, 120),
  ('blog_posts', 'Blog Posts', array['id'], 'org_id', null, true, true, true, true, 130),
  ('enhancement_tasks', 'Enhancement Tasks', array['id'], 'org_id', null, true, true, true, true, 140)
on conflict (table_name) do update set
  label = excluded.label,
  primary_key_columns = excluded.primary_key_columns,
  org_scope_column = excluded.org_scope_column,
  client_scope_column = excluded.client_scope_column,
  allow_read = excluded.allow_read,
  allow_insert = excluded.allow_insert,
  allow_update = excluded.allow_update,
  allow_delete = excluded.allow_delete,
  sort_order = excluded.sort_order;

create table if not exists public.data_studio_mutation_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  table_name text not null,
  operation text not null check (operation in ('insert', 'update', 'delete')),
  key_data jsonb not null default '{}'::jsonb,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists data_studio_mutation_log_org_created_idx
  on public.data_studio_mutation_log (org_id, created_at desc);

create index if not exists data_studio_mutation_log_table_created_idx
  on public.data_studio_mutation_log (table_name, created_at desc);

alter table public.data_studio_mutation_log enable row level security;

create policy "org admins can view data studio mutation log"
  on public.data_studio_mutation_log for select
  to authenticated
  using (public.is_org_admin(org_id));

revoke all on table public.data_studio_mutation_log from anon, authenticated;
grant select on table public.data_studio_mutation_log to authenticated;

create or replace function public._log_data_studio_mutation(
  p_org_id uuid,
  p_user_id uuid,
  p_client_id uuid,
  p_table_name text,
  p_operation text,
  p_key_data jsonb,
  p_before_data jsonb,
  p_after_data jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Invalid mutation audit identity.';
  end if;

  if not exists (
    select 1
    from public.org_members om
    where om.org_id = p_org_id
      and om.user_id = p_user_id
      and om.role in ('owner', 'admin')
  ) then
    raise exception 'Only organization owners and admins can write through Data Studio.';
  end if;

  insert into public.data_studio_mutation_log
    (org_id, user_id, client_id, table_name, operation, key_data, before_data, after_data)
  values
    (p_org_id, p_user_id, p_client_id, p_table_name, p_operation,
     coalesce(p_key_data, '{}'::jsonb), p_before_data, p_after_data);
end;
$$;

revoke all on function public._log_data_studio_mutation(uuid, uuid, uuid, text, text, jsonb, jsonb, jsonb)
  from public, anon;
grant execute on function public._log_data_studio_mutation(uuid, uuid, uuid, text, text, jsonb, jsonb, jsonb)
  to authenticated;

create or replace function public.get_data_studio_schema(p_org_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not exists (
    select 1
    from public.org_members om
    where om.org_id = p_org_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
  ) then
    raise exception 'The Data Studio is limited to organization owners and admins.';
  end if;

  select coalesce(jsonb_agg(table_json order by sort_order, table_name), '[]'::jsonb)
  into v_result
  from (
    select
      c.sort_order,
      c.table_name,
      jsonb_build_object(
        'tableName', c.table_name,
        'label', c.label,
        'primaryKeyColumns', to_jsonb(c.primary_key_columns),
        'orgScopeColumn', c.org_scope_column,
        'clientScopeColumn', c.client_scope_column,
        'allowRead', c.allow_read,
        'allowInsert', c.allow_insert,
        'allowUpdate', c.allow_update,
        'allowDelete', c.allow_delete,
        'protectedColumns', to_jsonb(c.protected_columns),
        'columns', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'name', cols.column_name,
              'dataType', cols.data_type,
              'udtName', cols.udt_name,
              'nullable', cols.is_nullable = 'YES',
              'defaultValue', cols.column_default,
              'identity', cols.is_identity = 'YES',
              'generated', cols.is_generated <> 'NEVER'
            )
            order by cols.ordinal_position
          )
          from information_schema.columns cols
          where cols.table_schema = 'public'
            and cols.table_name = c.table_name
        ), '[]'::jsonb)
      ) as table_json
    from public.data_studio_table_config c
    where c.allow_read = true
      and exists (
        select 1
        from information_schema.tables t
        where t.table_schema = 'public'
          and t.table_name = c.table_name
          and t.table_type = 'BASE TABLE'
      )
  ) configured;

  return v_result;
end;
$$;

revoke all on function public.get_data_studio_schema(uuid) from public, anon;
grant execute on function public.get_data_studio_schema(uuid) to authenticated;

create or replace function public.run_data_studio_mutation(
  p_org_id uuid,
  p_table_name text,
  p_operation text,
  p_key jsonb default '{}'::jsonb,
  p_values jsonb default '{}'::jsonb,
  p_client_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
set statement_timeout = '5s'
as $$
declare
  v_cfg public.data_studio_table_config%rowtype;
  v_operation text := lower(btrim(coalesce(p_operation, '')));
  v_values jsonb := coalesce(p_values, '{}'::jsonb);
  v_key jsonb := coalesce(p_key, '{}'::jsonb);
  v_user_id uuid := auth.uid();
  v_key_predicate text;
  v_scope_predicate text := 'true';
  v_columns text;
  v_select_columns text;
  v_set_clause text;
  v_before jsonb;
  v_after jsonb;
  v_client_from_values uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if not exists (
    select 1
    from public.org_members om
    where om.org_id = p_org_id
      and om.user_id = v_user_id
      and om.role in ('owner', 'admin')
  ) then
    raise exception 'The Data Studio is limited to organization owners and admins.';
  end if;

  select * into v_cfg
  from public.data_studio_table_config
  where table_name = p_table_name;

  if not found then
    raise exception 'Table % is not enabled for Data Studio.', p_table_name;
  end if;

  if v_operation not in ('insert', 'update', 'delete') then
    raise exception 'Data Studio only supports insert, update, and delete mutations.';
  end if;

  if (v_operation = 'insert' and not v_cfg.allow_insert)
     or (v_operation = 'update' and not v_cfg.allow_update)
     or (v_operation = 'delete' and not v_cfg.allow_delete) then
    raise exception '% is not enabled for table %.', upper(v_operation), p_table_name;
  end if;

  if p_client_id is not null then
    if not exists (
      select 1 from public.clients c
      where c.id = p_client_id and c.org_id = p_org_id
    ) then
      raise exception 'Unknown client for this organization.';
    end if;

    if v_cfg.client_scope_column is null then
      raise exception 'Table % is organization-scoped and does not support client filtering.', p_table_name;
    end if;
  end if;

  -- All supplied keys/values must map to real, writable columns.
  if exists (
    select 1
    from jsonb_object_keys(v_values) k
    where not exists (
      select 1
      from information_schema.columns cols
      where cols.table_schema = 'public'
        and cols.table_name = p_table_name
        and cols.column_name = k
        and cols.is_generated = 'NEVER'
        and cols.is_identity = 'NO'
    )
  ) then
    raise exception 'Mutation contains an unknown, generated, or identity column.';
  end if;

  if v_operation in ('update', 'delete') then
    if exists (
      select 1
      from unnest(v_cfg.primary_key_columns) pk
      where not (v_key ? pk)
    ) then
      raise exception 'All primary key fields are required for update/delete.';
    end if;

    if exists (
      select 1 from jsonb_object_keys(v_key) k
      where not (k = any(v_cfg.primary_key_columns))
    ) then
      raise exception 'Only configured primary key fields may be used to identify a row.';
    end if;
  end if;

  if v_operation in ('insert', 'update') and v_values = '{}'::jsonb then
    raise exception 'Enter at least one value to write.';
  end if;

  -- System identity/scope columns cannot be changed by the generic editor.
  if exists (
    select 1
    from jsonb_object_keys(v_values) k
    where k = any(v_cfg.protected_columns)
       or k = v_cfg.org_scope_column
       or (v_operation = 'update' and k = v_cfg.client_scope_column)
  ) then
    raise exception 'Mutation attempts to change a protected identity or scope column.';
  end if;

  -- Inject and validate scope for INSERTs.
  if v_operation = 'insert' then
    if v_cfg.org_scope_column is not null then
      v_values := jsonb_set(v_values, array[v_cfg.org_scope_column], to_jsonb(p_org_id), true);
    end if;

    if exists (
      select 1 from information_schema.columns cols
      where cols.table_schema = 'public'
        and cols.table_name = p_table_name
        and cols.column_name = 'created_by'
    ) then
      v_values := jsonb_set(v_values, array['created_by'], to_jsonb(v_user_id), true);
    end if;

    if v_cfg.client_scope_column is not null then
      if v_cfg.client_scope_column = any(v_cfg.primary_key_columns) then
        if p_client_id is not null then
          raise exception 'Create new client records from organization scope, not an existing client scope.';
        end if;
      elsif p_client_id is not null then
        v_values := jsonb_set(v_values, array[v_cfg.client_scope_column], to_jsonb(p_client_id), true);
      elsif v_values ? v_cfg.client_scope_column then
        begin
          v_client_from_values := (v_values ->> v_cfg.client_scope_column)::uuid;
        exception when others then
          raise exception 'Client scope value must be a valid UUID.';
        end;

        if not exists (
          select 1 from public.clients c
          where c.id = v_client_from_values and c.org_id = p_org_id
        ) then
          raise exception 'Inserted record references a client outside this organization.';
        end if;
      end if;
    end if;
  end if;

  -- Explicit org/client predicates are enforced in addition to the table's RLS.
  if v_cfg.org_scope_column is not null then
    v_scope_predicate := v_scope_predicate || format(
      ' and target.%I = %L::uuid', v_cfg.org_scope_column, p_org_id::text
    );
  end if;

  if p_client_id is not null and v_cfg.client_scope_column is not null then
    v_scope_predicate := v_scope_predicate || format(
      ' and target.%I = %L::uuid', v_cfg.client_scope_column, p_client_id::text
    );
  end if;

  if v_operation in ('update', 'delete') then
    select string_agg(
      format('target.%I is not distinct from keyrow.%I', pk, pk),
      ' and '
    )
    into v_key_predicate
    from unnest(v_cfg.primary_key_columns) pk;

    v_key_predicate := '(' || v_key_predicate || ') and ' || v_scope_predicate;

    execute format(
      'select to_jsonb(target) from public.%I target '
      || 'cross join jsonb_populate_record(null::public.%I, $1) keyrow '
      || 'where %s limit 1',
      p_table_name, p_table_name, v_key_predicate
    )
    using v_key
    into v_before;

    if v_before is null then
      raise exception 'No row matched the selected organization/client scope and primary key.';
    end if;
  end if;

  if v_operation = 'insert' then
    select
      string_agg(format('%I', k), ', ' order by k),
      string_agg(format('src.%I', k), ', ' order by k)
    into v_columns, v_select_columns
    from jsonb_object_keys(v_values) k;

    execute format(
      'insert into public.%I as target (%s) '
      || 'select %s from jsonb_populate_record(null::public.%I, $1) src '
      || 'returning to_jsonb(target)',
      p_table_name, v_columns, v_select_columns, p_table_name
    )
    using v_values
    into v_after;

  elsif v_operation = 'update' then
    select string_agg(format('%I = src.%I', k, k), ', ' order by k)
    into v_set_clause
    from jsonb_object_keys(v_values) k;

    execute format(
      'update public.%I as target set %s '
      || 'from jsonb_populate_record(null::public.%I, $1) src, '
      || 'jsonb_populate_record(null::public.%I, $2) keyrow '
      || 'where %s returning to_jsonb(target)',
      p_table_name, v_set_clause, p_table_name, p_table_name, v_key_predicate
    )
    using v_values, v_key
    into v_after;

    if v_after is null then
      raise exception 'The row was not updated.';
    end if;

  else
    execute format(
      'delete from public.%I as target '
      || 'using jsonb_populate_record(null::public.%I, $1) keyrow '
      || 'where %s returning to_jsonb(target)',
      p_table_name, p_table_name, v_key_predicate
    )
    using v_key
    into v_before;

    v_after := null;
  end if;

  perform public._log_data_studio_mutation(
    p_org_id,
    v_user_id,
    p_client_id,
    p_table_name,
    v_operation,
    case when v_operation = 'insert' then '{}'::jsonb else v_key end,
    case when v_operation = 'insert' then null else v_before end,
    case when v_operation = 'delete' then null else v_after end
  );

  return jsonb_build_object(
    'operation', v_operation,
    'tableName', p_table_name,
    'before', case when v_operation = 'insert' then null else v_before end,
    'after', case when v_operation = 'delete' then null else v_after end
  );
end;
$$;

revoke all on function public.run_data_studio_mutation(uuid, text, text, jsonb, jsonb, uuid)
  from public, anon;
grant execute on function public.run_data_studio_mutation(uuid, text, text, jsonb, jsonb, uuid)
  to authenticated;
