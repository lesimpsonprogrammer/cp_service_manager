-- CP Service Manager platform schema
-- Multi-tenant model: every business object hangs off an `organizations` row,
-- and access is scoped through `org_members`. Run via `supabase db push` or
-- the Supabase SQL editor against a fresh project.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Core tenancy
-- ---------------------------------------------------------------------------

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create type org_role as enum ('owner', 'admin', 'member', 'viewer');

create table org_members (
  org_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role org_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index org_members_user_id_idx on org_members (user_id);

-- ---------------------------------------------------------------------------
-- Data sources / connectors
-- ---------------------------------------------------------------------------

create type data_source_type as enum (
  'spreadsheet',
  'google_sheets',
  'rest_api',
  'sql_database',
  'hcm',
  'erp',
  'webhook'
);

create type data_source_status as enum ('connected', 'disconnected', 'error', 'pending');

create table data_sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  type data_source_type not null,
  status data_source_status not null default 'pending',
  -- Non-secret connection config only (host, spreadsheet id, base URL, HCM
  -- system name, field selections, ...). Credentials belong in a secrets
  -- manager / Supabase Vault, referenced here by `secret_ref`.
  config jsonb not null default '{}'::jsonb,
  secret_ref text,
  last_synced_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index data_sources_org_id_idx on data_sources (org_id);

-- ---------------------------------------------------------------------------
-- ETL pipelines
-- ---------------------------------------------------------------------------

create table pipelines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  source_id uuid not null references data_sources (id) on delete cascade,
  destination_id uuid references data_sources (id) on delete set null,
  -- [{ "source": "Employee_ID", "target": "employee_id" }, ...]
  mapping jsonb not null default '[]'::jsonb,
  -- [{ "op": "trim", "field": "email" }, { "op": "rename", ... }, ...]
  transform_steps jsonb not null default '[]'::jsonb,
  schedule text, -- cron expression, or null/'manual' for on-demand only
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pipelines_org_id_idx on pipelines (org_id);

create type pipeline_run_status as enum ('queued', 'running', 'succeeded', 'failed', 'partial');

create table pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references pipelines (id) on delete cascade,
  org_id uuid not null references organizations (id) on delete cascade,
  status pipeline_run_status not null default 'queued',
  records_extracted integer not null default 0,
  records_loaded integer not null default 0,
  records_failed integer not null default 0,
  error text,
  triggered_by text not null default 'manual', -- manual | schedule | webhook | api
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index pipeline_runs_pipeline_id_idx on pipeline_runs (pipeline_id, created_at desc);
create index pipeline_runs_org_id_idx on pipeline_runs (org_id);

-- ---------------------------------------------------------------------------
-- Webhooks
-- ---------------------------------------------------------------------------

create type webhook_direction as enum ('inbound', 'outbound');

create table webhooks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  direction webhook_direction not null,
  name text not null,
  target_url text, -- outbound only
  events text[] not null default '{}', -- outbound: event names subscribed to
  data_source_id uuid references data_sources (id) on delete cascade, -- inbound: which source it feeds
  inbound_token text unique, -- inbound: opaque token embedded in the receiver URL
  secret text not null, -- HMAC signing/verification secret
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index webhooks_org_id_idx on webhooks (org_id);

create table webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references webhooks (id) on delete cascade,
  org_id uuid not null references organizations (id) on delete cascade,
  event text not null,
  direction webhook_direction not null,
  payload jsonb not null default '{}'::jsonb,
  response_status integer,
  success boolean not null default false,
  error text,
  created_at timestamptz not null default now()
);

create index webhook_deliveries_webhook_id_idx on webhook_deliveries (webhook_id, created_at desc);

-- ---------------------------------------------------------------------------
-- API keys (for the public REST API, /api/v1/*)
-- ---------------------------------------------------------------------------

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  key_prefix text not null, -- short, non-secret identifier shown in the UI (e.g. cpsm_live_ab12)
  key_hash text not null, -- sha-256 of the full key; the raw key is shown once at creation
  last_used_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index api_keys_org_id_idx on api_keys (org_id);
create unique index api_keys_key_hash_idx on api_keys (key_hash);

-- ---------------------------------------------------------------------------
-- New-user bootstrap: every signup gets its own organization + owner role
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  base_slug text;
  final_slug text;
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  base_slug := coalesce(
    nullif(regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9]+', '-', 'g'), ''),
    'workspace'
  );
  final_slug := base_slug || '-' || substr(new.id::text, 1, 8);

  insert into public.organizations (name, slug)
  values (coalesce(new.raw_user_meta_data ->> 'company_name', initcap(base_slug) || '''s Workspace'), final_slug)
  returning id into new_org_id;

  insert into public.org_members (org_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table org_members enable row level security;
alter table data_sources enable row level security;
alter table pipelines enable row level security;
alter table pipeline_runs enable row level security;
alter table webhooks enable row level security;
alter table webhook_deliveries enable row level security;
alter table api_keys enable row level security;

create function public.is_org_member(check_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.org_members
    where org_id = check_org_id and user_id = auth.uid()
  );
$$;

create function public.is_org_admin(check_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.org_members
    where org_id = check_org_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

-- organizations: members can read; only admins/owners can update.
create policy "org members can view their organizations"
  on organizations for select
  using (public.is_org_member(id));

create policy "org admins can update their organization"
  on organizations for update
  using (public.is_org_admin(id));

-- profiles: a user can read/update their own profile; org-mates can read.
create policy "users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- org_members: members can see their org's roster.
create policy "org members can view roster"
  on org_members for select
  using (public.is_org_member(org_id));

create policy "org admins can manage roster"
  on org_members for all
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

-- Generic org-scoped read/write policy, reused for the business tables below:
-- any org member can read and write; tighten to is_org_admin() per-table if
-- you want connector/pipeline/webhook/API-key management restricted to
-- owners and admins only.

create policy "org members can manage data sources"
  on data_sources for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "org members can manage pipelines"
  on pipelines for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "org members can view pipeline runs"
  on pipeline_runs for select
  using (public.is_org_member(org_id));

create policy "org members can insert pipeline runs"
  on pipeline_runs for insert
  with check (public.is_org_member(org_id));

create policy "org admins can manage webhooks"
  on webhooks for all
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

create policy "org members can view webhook deliveries"
  on webhook_deliveries for select
  using (public.is_org_member(org_id));

create policy "org admins can manage api keys"
  on api_keys for all
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));
