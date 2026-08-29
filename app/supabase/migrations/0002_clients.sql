-- Clients: the companies each organization does data extraction, HR
-- consulting, or managed payroll work for. Data sources can optionally be
-- attributed to a client so pipelines/connectors roll up per-client.

create type client_status as enum ('active', 'prospect', 'inactive');

create table clients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  status client_status not null default 'active',
  primary_contact_name text,
  primary_contact_email text,
  primary_contact_phone text,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_org_id_idx on clients (org_id);

alter table data_sources
  add column client_id uuid references clients (id) on delete set null;

create index data_sources_client_id_idx on data_sources (client_id);

alter table clients enable row level security;

create policy "org members can manage clients"
  on clients for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));
