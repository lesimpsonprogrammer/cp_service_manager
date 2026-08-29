-- Client onboarding workflow + contract management.

create type onboarding_stage as enum (
  'not_started',
  'contract_sent',
  'contract_signed',
  'in_progress',
  'completed'
);

alter table clients
  add column onboarding_stage onboarding_stage not null default 'not_started';

create type contract_status as enum ('draft', 'sent', 'signed', 'active', 'expired', 'terminated');

create table client_contracts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  name text not null,
  status contract_status not null default 'draft',
  start_date date,
  end_date date,
  value numeric(12, 2),
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index client_contracts_client_id_idx on client_contracts (client_id, created_at desc);
create index client_contracts_org_id_idx on client_contracts (org_id);

alter table client_contracts enable row level security;

create policy "org members can manage client contracts"
  on client_contracts for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));
