-- CPSM Core Schema Migration Draft
-- Migration: 001_create_cpsm_core_schema
-- Purpose: Foundational Supabase Postgres schema for Client Portfolio Service Manager.
-- Status: Review-only draft. Do not apply to Supabase until approved.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.client_companies (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  client_code text not null unique,
  status text not null default 'pending_setup',
  primary_contact_name text,
  primary_contact_email text,
  account_owner_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  email text,
  default_client_company_id uuid references public.client_companies(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  role_key text not null unique,
  role_name text not null,
  role_description text,
  is_system_role boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  permission_key text not null unique,
  permission_name text not null,
  permission_group text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (role_id, permission_id)
);

create table if not exists public.client_user_access (
  id uuid primary key default gen_random_uuid(),
  client_company_id uuid not null references public.client_companies(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id),
  access_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_company_id, user_id, role_id)
);

create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null default '{}'::jsonb,
  setting_group text not null default 'general',
  description text,
  updated_by uuid references public.user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_company_settings (
  id uuid primary key default gen_random_uuid(),
  client_company_id uuid not null references public.client_companies(id) on delete cascade,
  setting_key text not null,
  setting_value jsonb not null default '{}'::jsonb,
  setting_group text not null default 'general',
  description text,
  updated_by uuid references public.user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_company_id, setting_key)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_company_id uuid not null references public.client_companies(id) on delete cascade,
  project_name text not null,
  project_status text not null default 'on_track',
  project_type text,
  project_manager_id uuid references public.user_profiles(id),
  description text,
  start_date date,
  target_due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  client_company_id uuid references public.client_companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  workflow_name text not null,
  workflow_status text not null default 'draft',
  workflow_type text,
  created_by uuid references public.user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agreements (
  id uuid primary key default gen_random_uuid(),
  client_company_id uuid not null references public.client_companies(id) on delete cascade,
  agreement_type text not null,
  agreement_status text not null default 'required',
  agreement_title text not null,
  signed_at timestamptz,
  signed_by uuid references public.user_profiles(id),
  storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_company_id uuid not null references public.client_companies(id) on delete cascade,
  project_id uuid references public.projects(id),
  invoice_number text,
  invoice_status text not null default 'draft',
  amount numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  issued_date date,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  client_company_id uuid references public.client_companies(id),
  actor_user_id uuid references public.user_profiles(id),
  action text not null,
  entity_table text,
  entity_id uuid,
  before_value jsonb,
  after_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create trigger set_client_companies_updated_at
before update on public.client_companies
for each row execute function public.set_updated_at();

create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create trigger set_client_user_access_updated_at
before update on public.client_user_access
for each row execute function public.set_updated_at();

create trigger set_system_settings_updated_at
before update on public.system_settings
for each row execute function public.set_updated_at();

create trigger set_client_company_settings_updated_at
before update on public.client_company_settings
for each row execute function public.set_updated_at();

create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger set_workflows_updated_at
before update on public.workflows
for each row execute function public.set_updated_at();

create trigger set_agreements_updated_at
before update on public.agreements
for each row execute function public.set_updated_at();

create trigger set_invoices_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

create index if not exists idx_user_profiles_default_client_company_id on public.user_profiles(default_client_company_id);
create index if not exists idx_client_user_access_client_company_id on public.client_user_access(client_company_id);
create index if not exists idx_client_user_access_user_id on public.client_user_access(user_id);
create index if not exists idx_client_user_access_role_id on public.client_user_access(role_id);
create index if not exists idx_client_company_settings_client_company_id on public.client_company_settings(client_company_id);
create index if not exists idx_projects_client_company_id on public.projects(client_company_id);
create index if not exists idx_projects_project_manager_id on public.projects(project_manager_id);
create index if not exists idx_workflows_client_company_id on public.workflows(client_company_id);
create index if not exists idx_workflows_project_id on public.workflows(project_id);
create index if not exists idx_agreements_client_company_id on public.agreements(client_company_id);
create index if not exists idx_invoices_client_company_id on public.invoices(client_company_id);
create index if not exists idx_invoices_project_id on public.invoices(project_id);
create index if not exists idx_audit_logs_client_company_id on public.audit_logs(client_company_id);
create index if not exists idx_audit_logs_actor_user_id on public.audit_logs(actor_user_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at);

alter table public.client_companies enable row level security;
alter table public.user_profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.client_user_access enable row level security;
alter table public.system_settings enable row level security;
alter table public.client_company_settings enable row level security;
alter table public.projects enable row level security;
alter table public.workflows enable row level security;
alter table public.agreements enable row level security;
alter table public.invoices enable row level security;
alter table public.audit_logs enable row level security;
