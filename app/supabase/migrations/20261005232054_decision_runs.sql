-- Server-created, organization-scoped Decision Center history.
create table public.decision_runs (
  id uuid primary key,
  org_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  engine text not null check (engine in ('simulation','risk','optimization','combined')),
  status text not null check (status in ('queued','running','completed','partial','failed')),
  scenario jsonb not null check (jsonb_typeof(scenario) = 'object'),
  response jsonb check (response is null or jsonb_typeof(response) = 'object'),
  error text,
  attempts integer not null default 0,
  worker_token uuid,
  lease_until timestamptz,
  available_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index decision_runs_org_created_idx on public.decision_runs(org_id, created_at desc);
alter table public.decision_runs enable row level security;
revoke all on public.decision_runs from anon, authenticated;
grant select on public.decision_runs to authenticated;
grant select, insert, update on public.decision_runs to service_role;
create policy "organization administrators can read decision runs"
  on public.decision_runs for select to authenticated
  using (exists (
    select 1 from public.org_members m
    where m.org_id = decision_runs.org_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  ));
-- Browser writes are deliberately ungranted: only the validated CPSM API
-- creates and completes run records after resolving the current organization.

-- One atomic claim per worker. Expired leases are recovered after interruptions.
create or replace function public.claim_decision_run()
returns setof public.decision_runs
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.decision_runs set status = 'failed', error = 'Processing failed after three attempts.',
    finished_at = now(), lease_until = null, worker_token = null
    where status = 'running' and lease_until < now() and attempts >= 3;
  return query
  with candidate as (
    select id from public.decision_runs
    where ((status = 'queued' and available_at <= now()) or
      (status = 'running' and lease_until < now())) and attempts < 3
    order by created_at for update skip locked limit 1
  )
  update public.decision_runs r set status = 'running', attempts = attempts + 1,
    worker_token = gen_random_uuid(), lease_until = now() + interval '2 minutes', error = null
  from candidate c where r.id = c.id returning r.*;
end;
$$;
revoke all on function public.claim_decision_run() from public, anon, authenticated;
grant execute on function public.claim_decision_run() to service_role;
