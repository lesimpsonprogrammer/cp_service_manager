-- Role-based access within the client portal itself. Each client_portal_users
-- row now carries a role, set at invite time, so the portal's screens can be
-- gated per person instead of every client contact seeing everything:
--   client_user           - operational view (Projects, Data & Syncs)
--   client_administrator  - full portal access (adds Contracts, Invoices)
--   client_tpa            - third-party accountant (Contracts, Invoices only)

do $$
begin
  if not exists (select 1 from pg_type where typname = 'client_portal_role') then
    create type client_portal_role as enum ('client_user', 'client_administrator', 'client_tpa');
  end if;
end $$;

alter table client_portal_invites add column if not exists role client_portal_role not null default 'client_user';
alter table client_portal_users add column if not exists role client_portal_role not null default 'client_user';

-- ---------------------------------------------------------------------------
-- handle_new_user: carry the invited role from client_portal_invites onto
-- the new client_portal_users row.
-- ---------------------------------------------------------------------------

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
