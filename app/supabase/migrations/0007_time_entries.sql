-- Project time tracking: billable hours logged against a client's project
-- (each project gets a human-readable project code, Clockify-style), and
-- optionally a specific contract, to compute against its hourly_rate.

create table projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  name text not null,
  project_code text not null,
  status text not null default 'active',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index projects_org_id_project_code_idx on projects (org_id, project_code);
create index projects_client_id_idx on projects (client_id);

alter table projects enable row level security;

create policy "org members can manage projects"
  on projects for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create table time_entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  project_id uuid not null references projects (id) on delete restrict,
  contract_id uuid references client_contracts (id) on delete set null,
  work_date date not null default current_date,
  hours numeric(6, 2) not null check (hours > 0),
  description text,
  billable boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index time_entries_org_id_idx on time_entries (org_id);
create index time_entries_client_id_idx on time_entries (client_id, work_date desc);
create index time_entries_project_id_idx on time_entries (project_id);
create index time_entries_contract_id_idx on time_entries (contract_id);

alter table time_entries enable row level security;

create policy "org members can manage time entries"
  on time_entries for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));
