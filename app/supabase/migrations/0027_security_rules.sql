-- Security rules schema, and the reviewer/proposer split that lets Jaren
-- (and other sys_admin agents) help manage and enforce security without
-- being able to unilaterally clear findings raised about themselves.
--
-- Three pieces, matching the scope decided for this MVP:
--   1. security_rules            — access/action policy rules (e.g. "no
--      agent may DELETE from clients", "require approval for writes to
--      invoices"). This is a schema for rules, not an enforcement engine
--      yet — no resource in the app reads/evaluates these rules at
--      runtime yet (the SQL editor's own blocklist is still hardcoded).
--      That wiring is the natural next step, deliberately not rushed in
--      alongside a new schema.
--   2. security_findings         — anomaly/threat findings (unusual query
--      volume, off-hours access, etc.) that Jaren or a human raises.
--   3. data_sensitivity_labels   — tags which tables/columns hold PII or
--      regulated data, referencing the existing COMPLIANCE_FRAMEWORKS
--      codes from src/lib/compliance/frameworks.ts.
--
-- Guardrail: sys_admin agents can SELECT and INSERT across all three
-- (propose rules, raise findings, tag sensitive data — "help manage and
-- enforce"), but only human 'owner'/'admin' roles can UPDATE/DELETE. A
-- rule change or a finding being closed out never happens on an agent's
-- own authority alone, including a finding raised about that agent.

create or replace function public.is_human_org_admin(check_org_id uuid)
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

create type security_rule_category as enum ('access_policy', 'anomaly', 'data_sensitivity');
create type security_rule_effect as enum ('block', 'require_approval', 'alert', 'allow');
create type security_severity as enum ('low', 'medium', 'high', 'critical');
create type security_finding_status as enum ('open', 'acknowledged', 'resolved', 'dismissed');
create type data_sensitivity_label as enum ('public', 'internal', 'confidential', 'pii', 'financial', 'health');

create table public.security_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  category security_rule_category not null,
  resource text not null default '*',
  action text not null default '*',
  condition jsonb not null default '{}'::jsonb,
  effect security_rule_effect not null default 'alert',
  severity security_severity not null default 'medium',
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index security_rules_org_id_idx on public.security_rules (org_id, category, is_active);

alter table public.security_rules enable row level security;

create policy "org admins incl agents can view security rules"
  on public.security_rules for select
  using (public.is_org_admin(org_id));

create policy "org admins incl agents can propose security rules"
  on public.security_rules for insert
  with check (public.is_org_admin(org_id));

create policy "human org admins can change security rules"
  on public.security_rules for update
  using (public.is_human_org_admin(org_id))
  with check (public.is_human_org_admin(org_id));

create policy "human org admins can remove security rules"
  on public.security_rules for delete
  using (public.is_human_org_admin(org_id));

create table public.security_findings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  rule_id uuid references public.security_rules (id) on delete set null,
  category security_rule_category not null,
  severity security_severity not null default 'medium',
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  actor_user_id uuid references auth.users (id) on delete set null,
  status security_finding_status not null default 'open',
  detected_by uuid references auth.users (id) on delete set null,
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now()
);

create index security_findings_org_id_idx on public.security_findings (org_id, status, created_at desc);

alter table public.security_findings enable row level security;

create policy "org admins incl agents can view security findings"
  on public.security_findings for select
  using (public.is_org_admin(org_id));

create policy "org admins incl agents can raise security findings"
  on public.security_findings for insert
  with check (public.is_org_admin(org_id));

-- Only humans close the loop — acknowledging, resolving, or dismissing,
-- including a finding raised about an agent's own behavior.
create policy "human org admins can update security findings"
  on public.security_findings for update
  using (public.is_human_org_admin(org_id))
  with check (public.is_human_org_admin(org_id));

create table public.data_sensitivity_labels (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  table_name text not null,
  column_name text,
  label data_sensitivity_label not null,
  compliance_frameworks text[] not null default '{}',
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, table_name, column_name)
);

alter table public.data_sensitivity_labels enable row level security;

create policy "org admins incl agents can view data sensitivity labels"
  on public.data_sensitivity_labels for select
  using (public.is_org_admin(org_id));

create policy "org admins incl agents can tag data sensitivity"
  on public.data_sensitivity_labels for insert
  with check (public.is_org_admin(org_id));

create policy "human org admins can change data sensitivity labels"
  on public.data_sensitivity_labels for update
  using (public.is_human_org_admin(org_id))
  with check (public.is_human_org_admin(org_id));

create policy "human org admins can remove data sensitivity labels"
  on public.data_sensitivity_labels for delete
  using (public.is_human_org_admin(org_id));
