-- Global Accounting: an org-level hub (Settings sidebar → Global Accounting)
-- that every client's Accounting tab and Invoices roll up into as
-- sub-accounts. This is where the org wires up its own connections to
-- external financial systems -- a billing system, a POS, and a general
-- ledger, each a separate connection slot. For now the setup form for each
-- is modeled on QuickBooks (company name, Realm/Company ID, environment,
-- OAuth client credentials, chart-of-accounts sync, fiscal year start) since
-- that's the reference accounting software; `provider` is stored per
-- connection so other providers can be added later without a new table.

create type accounting_connection_type as enum ('billing_system', 'pos', 'general_ledger');
create type accounting_connection_status as enum ('not_connected', 'connected', 'error');

create table accounting_connections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  connection_type accounting_connection_type not null,
  provider text not null default 'quickbooks',
  company_name text,
  -- Non-secret fields (realm id, environment, fiscal year start, etc.) and
  -- secret fields (client secret) both live here, same pattern as
  -- `data_sources.config` -- see README "Secrets" section. Secrets are
  -- masked in the UI and never echoed back to the client.
  config jsonb not null default '{}'::jsonb,
  status accounting_connection_status not null default 'not_connected',
  last_synced_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index accounting_connections_org_type_idx on accounting_connections (org_id, connection_type);

alter table accounting_connections enable row level security;

create policy "org members can view accounting connections"
  on accounting_connections for select
  using (public.is_org_member(org_id));

create policy "org admins can manage accounting connections"
  on accounting_connections for all
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));
