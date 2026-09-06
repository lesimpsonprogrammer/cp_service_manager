-- Functional Permissions (the "Access Permissions" design doc, Functional
-- Permissions section) — the org-side grantable flags (Global Accounting,
-- Client Accounting, Contract Management, Global Tenant Manager, Business
-- Intelligence) plus the client-portal role tiers (Client User, Client
-- Administrator, Client TPA).
--
-- Project Management is deliberately NOT duplicated here — it's already
-- represented by clients.project_manager_id / project_consultant_id
-- (0016/0023). This migration covers the rest of the doc.
--
-- Scoping decisions made in conversation with the org owner:
--   - Global Accounting, Global Tenant Manager, Business Intelligence are
--     org-wide flags (not tied to a client).
--   - Client Accounting is scoped to a specific client (an accountant can
--     hold it for more than one client, and can also hold Global
--     Accounting at the same time as a cross-check).
--   - Contract Management is scoped to a specific client too, and is only
--     meant to be handed to someone already trusted with that client (its
--     project_manager_id or project_consultant_id) — enforced in the app
--     layer when a grant is created, not by a DB constraint, since that
--     would need to look at another table's row.
--   - Owner/GSD implicitly has every permission everywhere and never needs
--     an explicit grant row — enforced in the app layer.

create type org_permission as enum (
  'global_accounting',
  'client_accounting',
  'contract_management',
  'global_tenant_manager',
  'business_intelligence'
);

create table permission_grants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  permission org_permission not null,
  client_id uuid references clients (id) on delete cascade,
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint permission_grants_scope_check check (
    (permission in ('client_accounting', 'contract_management') and client_id is not null)
    or (permission in ('global_accounting', 'global_tenant_manager', 'business_intelligence') and client_id is null)
  )
);

create index permission_grants_org_id_idx on permission_grants (org_id);
create index permission_grants_user_id_idx on permission_grants (user_id);
create index permission_grants_client_id_idx on permission_grants (client_id);

-- One grant per (user, permission) for org-wide permissions, and one per
-- (user, permission, client) for client-scoped ones.
create unique index permission_grants_org_wide_uniq
  on permission_grants (user_id, permission)
  where client_id is null;

create unique index permission_grants_client_scoped_uniq
  on permission_grants (user_id, permission, client_id)
  where client_id is not null;

alter table permission_grants enable row level security;

create policy "org admins can manage permission grants"
  on permission_grants for all
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

create policy "users can view their own permission grants"
  on permission_grants for select
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Client-portal role tiers: Client User (base, no decision authority),
-- Client Administrator (the client's signer/decision-maker), and Client
-- TPA (the client's own third-party administrator/delegate) — three real,
-- distinct people who can all be logged in on the same client account at
-- once, not a permission stacked on top of one another.
-- ---------------------------------------------------------------------------

create type client_portal_role as enum ('client_user', 'client_administrator', 'client_tpa');

alter table client_portal_users
  add column role client_portal_role not null default 'client_user';

alter table client_portal_invites
  add column role client_portal_role not null default 'client_user';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_token text;
  invite_row public.org_invites%rowtype;
  client_invite_token text;
  client_invite_row public.client_portal_invites%rowtype;
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  client_invite_token := new.raw_user_meta_data ->> 'client_invite_token';

  if client_invite_token is not null then
    select * into client_invite_row
    from public.client_portal_invites
    where token = client_invite_token::uuid
      and lower(email) = lower(new.email)
      and accepted_at is null
      and expires_at > now()
    limit 1;

    if client_invite_row.id is not null then
      insert into public.client_portal_users (id, org_id, client_id, email, role)
      values (new.id, client_invite_row.org_id, client_invite_row.client_id, new.email, client_invite_row.role);

      update public.client_portal_invites
      set accepted_at = now()
      where id = client_invite_row.id;

      return new;
    end if;
  end if;

  invite_token := new.raw_user_meta_data ->> 'invite_token';

  if invite_token is not null then
    select * into invite_row
    from public.org_invites
    where token = invite_token::uuid
      and lower(email) = lower(new.email)
      and accepted_at is null
      and expires_at > now()
    limit 1;
  end if;

  if invite_row.id is not null then
    insert into public.org_members (org_id, user_id, role)
    values (invite_row.org_id, new.id, invite_row.role);

    update public.org_invites
    set accepted_at = now()
    where id = invite_row.id;
  else
    insert into public.signup_requests (user_id, email, full_name, company_name)
    values (
      new.id,
      new.email,
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'company_name'
    );
  end if;

  return new;
end;
$$;
