-- Removing a member from org_members used to mean an immediate hard delete
-- with no way back and no in-between state. Give membership a real status
-- instead: active (normal), suspended (temporarily blocked, restorable),
-- removed (soft-deleted into a "recycle bin", restorable). The row itself
-- is never deleted here, so it's always auditable and reversible.

create type org_member_status as enum ('active', 'suspended', 'removed');

alter table org_members add column if not exists status org_member_status not null default 'active';
alter table org_members add column if not exists status_changed_at timestamptz;
alter table org_members add column if not exists status_changed_by uuid references auth.users (id) on delete set null;

-- ---------------------------------------------------------------------------
-- is_org_member / is_org_admin: only an active membership grants access.
-- Suspended and removed both stop granting access immediately, everywhere
-- these functions gate RLS. is_org_admin's role list matches its current
-- definition from 0026_ai_agents.sql (adds sys_admin for AI-agent accounts).
-- ---------------------------------------------------------------------------

create or replace function public.is_org_member(check_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.org_members
    where org_id = check_org_id and user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.is_org_admin(check_org_id uuid)
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
      and status = 'active'
      and role in ('owner', 'admin', 'sys_admin')
  );
$$;

-- Same two gaps found in is_human_org_admin (0027_security_rules.sql) and
-- is_any_org_admin (0011_signup_approval.sql) -- both checked role without
-- checking status, so a suspended/removed admin would have kept those two
-- specific privileges. Bringing them in line.

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
      and status = 'active'
      and role in ('owner', 'admin')
  );
$$;

create or replace function public.is_any_org_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.org_members
    where user_id = auth.uid() and status = 'active' and role in ('owner', 'admin')
  );
$$;
