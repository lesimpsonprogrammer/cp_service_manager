-- ---------------------------------------------------------------------------
-- Embedded payroll scaffold.
--
-- This does NOT run payroll itself. Tax withholding, agency filings, and
-- ACH money movement are handled by a licensed payroll-as-a-service
-- provider (e.g. Check, Gusto Embedded) — these tables mirror the minimum
-- state we need on our side to drive that provider's API and reflect its
-- webhooks back into the UI: which client is enrolled, which of their
-- employees are enrolled, and the history/status of each pay run.
--
-- `provider_*_id` columns hold the id the provider assigned when we created
-- that resource through their API — the provider remains the source of
-- truth for anything tax- or compliance-related.
-- ---------------------------------------------------------------------------

create type payroll_company_status as enum (
  'not_started',
  'onboarding',
  'active',
  'suspended'
);

create type payroll_employee_status as enum (
  'invited',
  'onboarding',
  'active',
  'terminated'
);

create type pay_run_status as enum (
  'draft',
  'processing',
  'submitted',
  'paid',
  'failed',
  'canceled'
);

create table payroll_companies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  provider text not null default 'check',
  provider_company_id text,
  status payroll_company_status not null default 'not_started',
  ein text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id)
);

create index payroll_companies_org_id_idx on payroll_companies (org_id);
create index payroll_companies_client_id_idx on payroll_companies (client_id);

create table payroll_employees (
  id uuid primary key default gen_random_uuid(),
  payroll_company_id uuid not null references payroll_companies (id) on delete cascade,
  provider_employee_id text,
  first_name text not null,
  last_name text not null,
  email text,
  status payroll_employee_status not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payroll_employees_company_id_idx on payroll_employees (payroll_company_id);

create table pay_runs (
  id uuid primary key default gen_random_uuid(),
  payroll_company_id uuid not null references payroll_companies (id) on delete cascade,
  provider_pay_run_id text,
  pay_period_start date not null,
  pay_period_end date not null,
  pay_date date not null,
  status pay_run_status not null default 'draft',
  gross_pay_cents bigint,
  net_pay_cents bigint,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pay_runs_company_id_idx on pay_runs (payroll_company_id);

-- Raw webhook events from the payroll provider (pay run status changes, tax
-- filing confirmations, etc.), same pattern as `webhook_deliveries` — kept
-- for audit/debugging and to drive UI status updates idempotently.
create table payroll_provider_events (
  id uuid primary key default gen_random_uuid(),
  payroll_company_id uuid references payroll_companies (id) on delete cascade,
  provider text not null default 'check',
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create index payroll_provider_events_company_id_idx on payroll_provider_events (payroll_company_id);

alter table payroll_companies enable row level security;
alter table payroll_employees enable row level security;
alter table pay_runs enable row level security;
alter table payroll_provider_events enable row level security;

create policy "org members can view payroll companies"
  on payroll_companies for select
  using (public.is_org_member(org_id));

create policy "org admins can manage payroll companies"
  on payroll_companies for insert
  with check (public.is_org_admin(org_id));

create policy "org admins can update payroll companies"
  on payroll_companies for update
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

create policy "org admins can delete payroll companies"
  on payroll_companies for delete
  using (public.is_org_admin(org_id));

create policy "org members can view payroll employees"
  on payroll_employees for select
  using (
    exists (
      select 1 from payroll_companies pc
      where pc.id = payroll_employees.payroll_company_id
        and public.is_org_member(pc.org_id)
    )
  );

create policy "org admins can manage payroll employees"
  on payroll_employees for all
  using (
    exists (
      select 1 from payroll_companies pc
      where pc.id = payroll_employees.payroll_company_id
        and public.is_org_admin(pc.org_id)
    )
  )
  with check (
    exists (
      select 1 from payroll_companies pc
      where pc.id = payroll_employees.payroll_company_id
        and public.is_org_admin(pc.org_id)
    )
  );

create policy "org members can view pay runs"
  on pay_runs for select
  using (
    exists (
      select 1 from payroll_companies pc
      where pc.id = pay_runs.payroll_company_id
        and public.is_org_member(pc.org_id)
    )
  );

create policy "org admins can manage pay runs"
  on pay_runs for all
  using (
    exists (
      select 1 from payroll_companies pc
      where pc.id = pay_runs.payroll_company_id
        and public.is_org_admin(pc.org_id)
    )
  )
  with check (
    exists (
      select 1 from payroll_companies pc
      where pc.id = pay_runs.payroll_company_id
        and public.is_org_admin(pc.org_id)
    )
  );

create policy "org members can view payroll provider events"
  on payroll_provider_events for select
  using (
    exists (
      select 1 from payroll_companies pc
      where pc.id = payroll_provider_events.payroll_company_id
        and public.is_org_member(pc.org_id)
    )
  );
