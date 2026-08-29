-- Internal documentation / wiki pages for developers and owners
-- (GitHub-README-style), written in Markdown.

create table docs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  title text not null,
  slug text not null,
  body text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index docs_org_id_slug_idx on docs (org_id, slug);
create index docs_org_id_idx on docs (org_id);

alter table docs enable row level security;

create policy "org members can manage docs"
  on docs for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));
