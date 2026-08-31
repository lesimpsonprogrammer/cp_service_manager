-- Public-facing blog: org members write posts in the dashboard, published
-- posts are readable by anyone at /blog (public route uses the service-role
-- admin client with an explicit `published = true` filter, the same
-- pattern already used for /sign/[token] — see src/lib/supabase/admin.ts).

create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  title text not null,
  slug text not null,
  excerpt text not null default '',
  body text not null default '',
  category text not null default 'General',
  author_name text not null default '',
  published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index blog_posts_org_id_slug_idx on blog_posts (org_id, slug);
create index blog_posts_org_id_idx on blog_posts (org_id);
create index blog_posts_published_idx on blog_posts (published, published_at desc);

alter table blog_posts enable row level security;

-- Org members manage all posts (drafts and published) from the dashboard.
create policy "org members can manage blog posts"
  on blog_posts for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));
