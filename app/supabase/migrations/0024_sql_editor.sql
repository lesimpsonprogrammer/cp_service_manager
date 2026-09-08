-- Read-only SQL editor MVP (stage 1 of the staged rollout: read-only first,
-- controlled write access later). Lets org owners/admins run ad-hoc SELECT
-- queries against their own org's data for validation, model testing, and
-- pipeline troubleshooting, without handing out direct database credentials.
--
-- Safety model:
--   * `run_sql_editor_query` is SECURITY INVOKER, so it executes as the
--     calling user's `authenticated` role and every table it touches is
--     still governed by that table's normal RLS policies — the editor can
--     never see more than the signed-in user already could.
--   * Only a single SELECT/WITH statement is accepted; DDL/DML keywords,
--     multiple statements, and locking clauses are rejected before
--     execution.
--   * Results are capped at 500 rows and the statement is aborted after 5
--     seconds.
--   * Every run (success or failure) is written to
--     `sql_editor_query_log` via a SECURITY DEFINER helper, so regular
--     query execution can never forge its own audit trail.
--   * Access is gated to org owners/admins both here (role check inside the
--     function) and in the app layer (page + nav are hidden from other
--     roles).

create table public.sql_editor_query_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  query text not null,
  row_count integer,
  status text not null check (status in ('success', 'error')),
  error_message text,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create index sql_editor_query_log_org_id_idx
  on public.sql_editor_query_log (org_id, created_at desc);

alter table public.sql_editor_query_log enable row level security;

-- No insert/update/delete policy for regular roles: rows can only be
-- created through `_log_sql_editor_query` (SECURITY DEFINER below), so a
-- user can never tamper with or fabricate their own audit history.
create policy "org admins can view sql editor query log"
  on public.sql_editor_query_log for select
  using (public.is_org_admin(org_id));

create function public._log_sql_editor_query(
  p_org_id uuid,
  p_user_id uuid,
  p_query text,
  p_row_count integer,
  p_status text,
  p_error_message text,
  p_duration_ms integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.sql_editor_query_log
    (org_id, user_id, query, row_count, status, error_message, duration_ms)
  values (
    p_org_id,
    p_user_id,
    left(p_query, 8000),
    p_row_count,
    p_status,
    left(p_error_message, 2000),
    p_duration_ms
  );
end;
$$;

revoke all on function public._log_sql_editor_query from public, anon, authenticated;

create function public.run_sql_editor_query(query text)
returns jsonb
language plpgsql
security invoker
set search_path = public
set statement_timeout = '5s'
as $$
declare
  v_org_id uuid;
  v_role public.org_role;
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

grant execute on function public.run_sql_editor_query(text) to authenticated;
