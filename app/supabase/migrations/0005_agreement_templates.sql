-- Reusable agreement templates: org-wide contract boilerplate with
-- placeholder tokens ({{client_name}}, {{org_name}}, {{contract_name}},
-- {{start_date}}, {{end_date}}, {{value}}) resolved when a contract is
-- rendered to PDF or shown on the public signing page.

create table agreement_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  body text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index agreement_templates_org_id_idx on agreement_templates (org_id);

alter table agreement_templates enable row level security;

create policy "org members can manage agreement templates"
  on agreement_templates for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));
