-- Archive-first data retention: rather than hard-deleting recycle-bin data,
-- it moves into org-scoped, categorized archive storage once it's old enough
-- to be eligible -- still in this database, still fully retrievable, just
-- out of the live/active tables. Each org can tune its own retention window
-- per category (their data, their compliance obligations); 7 years is the
-- pre-filled safe default (covers FLSA/IRS federal minimums and the
-- strictest state payroll/HIPAA rules found in research), not a hardcoded
-- rule -- an org in a state with different requirements can change it.

create table retention_policies (
  org_id uuid not null references organizations (id) on delete cascade,
  category text not null,
  retention_years integer not null default 7,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  primary key (org_id, category)
);

create table archived_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  category text not null,
  source_id text not null,
  data jsonb not null,
  removed_at timestamptz not null,
  archived_at timestamptz not null default now(),
  archived_by uuid references auth.users (id) on delete set null,
  batch_label text not null
);

create index archived_records_org_category_idx on archived_records (org_id, category, archived_at desc);

alter table retention_policies enable row level security;
alter table archived_records enable row level security;

create policy "org admins can manage retention policies"
  on retention_policies for all
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

create policy "org admins can view and restore archived records"
  on archived_records for all
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));
