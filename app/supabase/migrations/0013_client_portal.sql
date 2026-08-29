-- Client portal: gives each client's own contact a persistent, read-only
-- login into their own data — separate from staff `org_members` accounts.
-- Modeled like a Fivetran/Snowflake customer view: connection status, sync
-- history, contracts, invoices, and project progress, scoped strictly to
-- their own `client_id` by RLS. Access is invite-only (see
-- `client_portal_invites`), mirroring the existing `org_invites` flow.

-- ---------------------------------------------------------------------------
-- Project Kanban stage: `projects.status` already exists (0007) but was
-- never more than a free-text default; nothing else in the app reads or
-- writes it besides the 'active' default set at creation, so it's safe to
-- turn it into the four-stage board a client's dashboard renders.
-- ---------------------------------------------------------------------------

update projects set status = 'in_progress' where status = 'active';
update projects set status = 'complete' where status in ('completed', 'done', 'complete');
update projects set status = 'intake' where status not in ('intake', 'in_progress', 'client_review', 'complete');

alter table projects alter column status set default 'intake';
alter table projects add constraint projects_status_check
  check (status in ('intake', 'in_progress', 'client_review', 'complete'));

-- ---------------------------------------------------------------------------
-- Client portal accounts
-- ---------------------------------------------------------------------------

create table client_portal_users (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid not null references organizations (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create index client_portal_users_client_id_idx on client_portal_users (client_id);
create index client_portal_users_org_id_idx on client_portal_users (org_id);

create table client_portal_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  email text not null,
  token uuid not null default gen_random_uuid(),
  invited_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index client_portal_invites_token_idx on client_portal_invites (token);
create index client_portal_invites_client_id_idx on client_portal_invites (client_id, created_at desc);

alter table client_portal_users enable row level security;
alter table client_portal_invites enable row level security;

create function public.is_client_portal_user(check_client_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.client_portal_users
    where client_id = check_client_id and id = auth.uid()
  );
$$;

create policy "client users can view their own membership"
  on client_portal_users for select
  using (id = auth.uid());

create policy "org admins can manage client portal users"
  on client_portal_users for all
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

create policy "org admins can manage client portal invites"
  on client_portal_invites for all
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

-- ---------------------------------------------------------------------------
-- handle_new_user: also accept a client-portal invite token. A client invite
-- links the new auth user straight to client_portal_users and skips both the
-- org-bootstrap and signup-approval paths entirely — a client is never an
-- org member.
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
      insert into public.client_portal_users (id, org_id, client_id, email)
      values (new.id, client_invite_row.org_id, client_invite_row.client_id, new.email);

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

-- ---------------------------------------------------------------------------
-- Read-only RLS grants for client portal users, additive to the existing
-- "org members can manage X" policies (Postgres OR's permissive policies for
-- the same command together).
-- ---------------------------------------------------------------------------

create policy "client users can view their own client record"
  on clients for select
  using (public.is_client_portal_user(id));

create policy "client users can view their projects"
  on projects for select
  using (public.is_client_portal_user(client_id));

create policy "client users can view their data sources"
  on data_sources for select
  using (client_id is not null and public.is_client_portal_user(client_id));

create policy "client users can view their pipelines"
  on pipelines for select
  using (
    exists (
      select 1 from public.data_sources ds
      where ds.id = pipelines.source_id
        and ds.client_id is not null
        and public.is_client_portal_user(ds.client_id)
    )
  );

create policy "client users can view their pipeline runs"
  on pipeline_runs for select
  using (
    exists (
      select 1 from public.pipelines p
      join public.data_sources ds on ds.id = p.source_id
      where p.id = pipeline_runs.pipeline_id
        and ds.client_id is not null
        and public.is_client_portal_user(ds.client_id)
    )
  );

create policy "client users can view their contracts"
  on client_contracts for select
  using (public.is_client_portal_user(client_id));

create policy "client users can view their invoices"
  on invoices for select
  using (public.is_client_portal_user(client_id));

create policy "client users can view their invoice line items"
  on invoice_line_items for select
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_line_items.invoice_id
        and public.is_client_portal_user(i.client_id)
    )
  );

create policy "client users can view their timecards"
  on timecards for select
  using (public.is_client_portal_user(client_id));

create policy "client users can view their time entries"
  on time_entries for select
  using (public.is_client_portal_user(client_id));

-- ---------------------------------------------------------------------------
-- Realtime: let the client dashboard subscribe to postgres_changes on its
-- own projects/pipeline_runs/data_sources rows (RLS above already scopes
-- what a subscription can actually receive).
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table pipeline_runs;
alter publication supabase_realtime add table data_sources;
