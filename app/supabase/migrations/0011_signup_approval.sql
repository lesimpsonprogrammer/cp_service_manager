-- Locks down account creation: the public signup form still exists, but a
-- brand-new signup with no invite no longer gets an organization for free.
-- It lands in `signup_requests` (pending) until an org owner/admin approves
-- it into an existing org, or rejects it. An invite link
-- (`org_invites`, generated from Settings by an owner/admin) skips the
-- queue entirely and joins the invited org right away.

create table org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  email text not null,
  role org_role not null default 'member',
  token uuid not null default gen_random_uuid(),
  invited_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index org_invites_token_idx on org_invites (token);
create index org_invites_org_id_idx on org_invites (org_id, created_at desc);

alter table org_invites enable row level security;

create policy "org admins can manage invites"
  on org_invites for all
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

create type signup_request_status as enum ('pending', 'approved', 'rejected');

create table signup_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  company_name text,
  status signup_request_status not null default 'pending',
  decided_at timestamptz,
  decided_by uuid references auth.users (id) on delete set null,
  decision_org_id uuid references organizations (id) on delete set null,
  decision_role org_role,
  created_at timestamptz not null default now()
);

create index signup_requests_status_idx on signup_requests (status, created_at desc);

alter table signup_requests enable row level security;

-- Any owner/admin of any org can see and decide the platform's pending
-- signups — this scaffold has no separate "platform admin" concept, and in
-- practice this app runs one business's workspace, so its owners are the
-- approvers.
create function public.is_any_org_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.org_members
    where user_id = auth.uid() and role in ('owner', 'admin')
  );
$$;

create policy "org admins can view signup requests"
  on signup_requests for select
  using (public.is_any_org_admin());

create policy "org admins can decide signup requests"
  on signup_requests for update
  using (public.is_any_org_admin())
  with check (public.is_any_org_admin());

-- Replaces the old "every signup gets its own org" bootstrap. An invite
-- token in the new user's metadata joins that invite's org directly;
-- otherwise the signup is queued for manual approval and gets no org
-- membership until one is granted.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_token text;
  invite_row public.org_invites%rowtype;
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

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
