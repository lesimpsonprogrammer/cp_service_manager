-- A managed list of doc categories per org (Settings → Doc categories),
-- rather than whatever free text happened to get typed into a doc's
-- category field.

create table doc_categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index doc_categories_org_id_name_idx on doc_categories (org_id, lower(name));
create index doc_categories_org_id_idx on doc_categories (org_id, name);

alter table doc_categories enable row level security;

create policy "org members can manage doc categories"
  on doc_categories for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

-- Seed "General" for every existing org so the doc form always has at
-- least one category to offer.
insert into doc_categories (org_id, name)
select id, 'General' from organizations
on conflict do nothing;
