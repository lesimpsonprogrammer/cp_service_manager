-- Harden Data Studio auditing by moving the SECURITY DEFINER audit helper
-- out of the exposed public schema. The public mutation RPC remains SECURITY
-- INVOKER so normal table RLS continues to apply.

create schema if not exists private;

create or replace function private._log_data_studio_mutation(
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
set search_path = public, private
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

revoke all on function private._log_data_studio_mutation(uuid, uuid, uuid, text, text, jsonb, jsonb, jsonb)
  from public, anon;
grant usage on schema private to authenticated;
grant execute on function private._log_data_studio_mutation(uuid, uuid, uuid, text, text, jsonb, jsonb, jsonb)
  to authenticated;

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
set search_path = public, private
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
    select 1 from public.org_members om
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

  if exists (
    select 1 from jsonb_object_keys(v_values) k
    where not exists (
      select 1 from information_schema.columns cols
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
      select 1 from unnest(v_cfg.primary_key_columns) pk
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

  if exists (
    select 1 from jsonb_object_keys(v_values) k
    where k = any(v_cfg.protected_columns)
       or k = v_cfg.org_scope_column
       or (v_operation = 'update' and k = v_cfg.client_scope_column)
  ) then
    raise exception 'Mutation attempts to change a protected identity or scope column.';
  end if;

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

  perform private._log_data_studio_mutation(
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

revoke all on function public._log_data_studio_mutation(uuid, uuid, uuid, text, text, jsonb, jsonb, jsonb)
  from public, anon, authenticated;
drop function if exists public._log_data_studio_mutation(uuid, uuid, uuid, text, text, jsonb, jsonb, jsonb);
