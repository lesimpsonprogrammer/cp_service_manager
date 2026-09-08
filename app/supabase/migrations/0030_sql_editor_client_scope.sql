-- SQL Editor: optional per-client scoping, plus an org-level safety switch
-- that locks the editor back to org-wide only.
--
-- How the scoping actually restricts rows:
--   `run_sql_editor_query` now takes an optional `client_id`. When set (and
--   the caller's org isn't locked), it sets the transaction-local GUC
--   `app.sql_editor_client_id` before executing the caller's query. A new
--   RESTRICTIVE policy on each client-owned table then ANDs an additional
--   `client_id = <guc>` check onto the table's existing permissive RLS
--   policy — but only for SELECT, and only when that GUC is actually set.
--   Every other code path in the app never sets this GUC, so
--   `current_setting(..., true)` returns null there and the restrictive
--   policy is a no-op — normal reads/writes are completely unaffected.

alter table public.organizations
  add column sql_editor_lock_org_scope boolean not null default false;

comment on column public.organizations.sql_editor_lock_org_scope is
  'When true, the SQL Editor ignores/rejects a client_id and always runs org-wide. Toggled from Settings.';

-- ---------------------------------------------------------------------------
-- Restrictive per-client RLS, gated on the session GUC set below.
-- ---------------------------------------------------------------------------

create policy "sql editor client scope restricts clients"
  on clients as restrictive for select
  using (
    nullif(current_setting('app.sql_editor_client_id', true), '') is null
    or id = nullif(current_setting('app.sql_editor_client_id', true), '')::uuid
  );

create policy "sql editor client scope restricts client contracts"
  on client_contracts as restrictive for select
  using (
    nullif(current_setting('app.sql_editor_client_id', true), '') is null
    or client_id = nullif(current_setting('app.sql_editor_client_id', true), '')::uuid
  );

create policy "sql editor client scope restricts projects"
  on projects as restrictive for select
  using (
    nullif(current_setting('app.sql_editor_client_id', true), '') is null
    or client_id = nullif(current_setting('app.sql_editor_client_id', true), '')::uuid
  );

create policy "sql editor client scope restricts time entries"
  on time_entries as restrictive for select
  using (
    nullif(current_setting('app.sql_editor_client_id', true), '') is null
    or client_id = nullif(current_setting('app.sql_editor_client_id', true), '')::uuid
  );

create policy "sql editor client scope restricts timecards"
  on timecards as restrictive for select
  using (
    nullif(current_setting('app.sql_editor_client_id', true), '') is null
    or client_id = nullif(current_setting('app.sql_editor_client_id', true), '')::uuid
  );

create policy "sql editor client scope restricts invoices"
  on invoices as restrictive for select
  using (
    nullif(current_setting('app.sql_editor_client_id', true), '') is null
    or client_id = nullif(current_setting('app.sql_editor_client_id', true), '')::uuid
  );

create policy "sql editor client scope restricts invoice line items"
  on invoice_line_items as restrictive for select
  using (
    nullif(current_setting('app.sql_editor_client_id', true), '') is null
    or exists (
      select 1 from invoices i
      where i.id = invoice_line_items.invoice_id
        and i.client_id = nullif(current_setting('app.sql_editor_client_id', true), '')::uuid
    )
  );

create policy "sql editor client scope restricts data sources"
  on data_sources as restrictive for select
  using (
    nullif(current_setting('app.sql_editor_client_id', true), '') is null
    or client_id = nullif(current_setting('app.sql_editor_client_id', true), '')::uuid
  );

-- ---------------------------------------------------------------------------
-- run_sql_editor_query: add the optional client_id parameter.
-- ---------------------------------------------------------------------------

drop function if exists public.run_sql_editor_query(text);

create function public.run_sql_editor_query(query text, client_id uuid default null)
returns jsonb
language plpgsql
security invoker
set search_path = public
set statement_timeout = '5s'
as $$
declare
  v_org_id uuid;
  v_role public.org_role;
  v_lock_scope boolean;
  v_trimmed text;
  v_result jsonb;
  v_row_count integer;
  v_start timestamptz := clock_timestamp();
  v_duration_ms integer;
  v_error text;
begin
  select org_id, role into v_org_id, v_role
  from public.org_members
  where user_id = auth.uid()
  order by created_at asc
  limit 1;

  if v_org_id is null then
    raise exception 'Not a member of any organization.';
  end if;

  if v_role not in ('owner', 'admin') then
    raise exception 'The SQL editor is limited to organization owners and admins.';
  end if;

  if client_id is not null then
    select sql_editor_lock_org_scope into v_lock_scope
    from public.organizations
    where id = v_org_id;

    if coalesce(v_lock_scope, false) then
      raise exception 'Client scoping is locked to org-wide in Settings.';
    end if;

    if not exists (
      select 1 from public.clients where id = client_id and org_id = v_org_id
    ) then
      raise exception 'Unknown client for this organization.';
    end if;
  end if;

  perform set_config('app.sql_editor_client_id', coalesce(client_id::text, ''), true);

  v_trimmed := btrim(query);

  if right(v_trimmed, 1) = ';' then
    v_trimmed := btrim(left(v_trimmed, length(v_trimmed) - 1));
  end if;

  if v_trimmed = '' then
    raise exception 'Enter a query to run.';
  end if;

  if position(';' in v_trimmed) > 0 then
    raise exception 'Only a single statement is allowed.';
  end if;

  if v_trimmed !~* '^(select|with)\y' then
    raise exception 'Only SELECT queries are allowed.';
  end if;

  if v_trimmed ~* '\y(insert|update|delete|drop|alter|truncate|grant|revoke|create|copy|vacuum|call|execute|do|merge|refresh|reindex|comment|lock|listen|notify|unlisten|set|reset|begin|commit|rollback|savepoint|prepare|deallocate|into|for\s+update|for\s+share|for\s+no\s+key\s+update|for\s+key\s+share)\y' then
    raise exception 'Query contains a disallowed keyword. Only plain SELECT reads are permitted.';
  end if;

  begin
    -- The user's query is wrapped as a derived table (never spliced with a
    -- trailing LIMIT), so a query that already ends in its own LIMIT/ORDER
    -- BY still parses; the outer LIMIT is what actually caps the result set.
    execute format(
      'select coalesce(jsonb_agg(row_to_json(sql_editor_row)), ''[]''::jsonb) from (select * from (%s) as sql_editor_query limit 500) as sql_editor_row',
      v_trimmed
    ) into v_result;
  exception when others then
    get stacked diagnostics v_error = message_text;
    v_duration_ms := extract(milliseconds from clock_timestamp() - v_start)::integer;
    perform public._log_sql_editor_query(
      v_org_id, auth.uid(), v_trimmed, null, 'error', v_error, v_duration_ms
    );
    raise;
  end;

  v_row_count := jsonb_array_length(v_result);
  v_duration_ms := extract(milliseconds from clock_timestamp() - v_start)::integer;

  perform public._log_sql_editor_query(
    v_org_id, auth.uid(), v_trimmed, v_row_count, 'success', null, v_duration_ms
  );

  return v_result;
end;
$$;

grant execute on function public.run_sql_editor_query(text, uuid) to authenticated;
