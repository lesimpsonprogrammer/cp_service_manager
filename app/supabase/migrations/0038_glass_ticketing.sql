-- GLASS Ticketing: service desk for staff and client-portal users.
--
--   * tickets              one row per request, numbered per workspace (GLS-1001, ...)
--   * ticket_messages      the conversation; `is_internal` notes are staff-only
--   * ticket_attachments   files on a ticket/message; bytes live in the private
--                          `ticket-attachments` Storage bucket and are only
--                          ever served through a short-lived signed URL after
--                          an RLS-scoped row check
--   * ticket_events        append-only audit trail, written by triggers so it
--                          can't be skipped by any code path (UI, portal, API, cron)
--   * ticket_watchers      staff who get notified on a ticket besides the assignee
--   * ticket_categories    routing: a category can auto-assign a default owner
--   * ticket_sla_policies  first-response / resolution targets per priority
--   * ticket_macros        canned replies
--
-- Numbering, SLA due dates, SLA pause/resume, auto-assignment, tenancy checks
-- and the audit trail all live in triggers, so the database stays correct no
-- matter which path writes the row.
--
-- Clients only ever get SELECT through RLS. Every client write (new ticket,
-- reply, close/reopen, rating) goes through a server action that re-checks
-- portal membership and then writes with the service role, so a client can
-- never set staff-only columns (assignee, internal notes, SLA fields).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_client_portal_org_user(check_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.client_portal_users
    where org_id = check_org_id and id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Configuration tables
-- ---------------------------------------------------------------------------

create table public.ticket_sla_policies (
  org_id uuid not null references public.organizations (id) on delete cascade,
  priority text not null check (priority in ('low', 'normal', 'high', 'urgent')),
  first_response_minutes integer not null check (first_response_minutes > 0),
  resolution_minutes integer not null check (resolution_minutes > 0),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (org_id, priority),
  check (resolution_minutes >= first_response_minutes)
);

create table public.ticket_categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  description text,
  default_assignee_id uuid references auth.users (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

create index ticket_categories_org_id_idx on public.ticket_categories (org_id);

create table public.ticket_macros (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  body text not null check (char_length(body) between 1 and 20000),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);

create index ticket_macros_org_id_idx on public.ticket_macros (org_id);

-- Per-workspace sequence for human-readable ticket numbers. Only the trigger
-- below touches it (RLS on, no policies).
create table public.ticket_counters (
  org_id uuid primary key references public.organizations (id) on delete cascade,
  last_value integer not null
);

-- ---------------------------------------------------------------------------
-- Tickets
-- ---------------------------------------------------------------------------

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  ticket_number text not null,
  client_id uuid references public.clients (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  category_id uuid references public.ticket_categories (id) on delete set null,
  subject text not null check (char_length(btrim(subject)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 20000),
  status text not null default 'new'
    check (status in ('new', 'open', 'pending_client', 'on_hold', 'resolved', 'closed')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  type text not null default 'question'
    check (type in ('question', 'incident', 'service_request', 'change_request', 'problem')),
  channel text not null default 'staff'
    check (channel in ('portal', 'staff', 'email', 'api')),
  -- False keeps a client-linked ticket internal: it never appears in that
  -- client's portal and the requester isn't emailed.
  client_visible boolean not null default true,
  requester_user_id uuid references auth.users (id) on delete set null,
  requester_name text,
  requester_email text,
  assignee_id uuid references auth.users (id) on delete set null,
  tags text[] not null default '{}',
  first_response_due_at timestamptz,
  resolution_due_at timestamptz,
  first_responded_at timestamptz,
  sla_paused_at timestamptz,
  sla_paused_seconds integer not null default 0,
  sla_breach_notified_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  reopened_count integer not null default 0,
  satisfaction_rating smallint check (satisfaction_rating between 1 and 5),
  satisfaction_comment text check (char_length(satisfaction_comment) <= 2000),
  last_activity_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, ticket_number)
);

create index tickets_org_status_activity_idx on public.tickets (org_id, status, last_activity_at desc);
create index tickets_org_assignee_idx on public.tickets (org_id, assignee_id, status);
create index tickets_client_idx on public.tickets (client_id, created_at desc);
create index tickets_open_due_idx on public.tickets (org_id, resolution_due_at)
  where status not in ('resolved', 'closed');
create index tickets_tags_idx on public.tickets using gin (tags);

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  author_type text not null check (author_type in ('staff', 'client', 'system')),
  -- Denormalized so client-portal users can see who replied without needing
  -- read access to staff profiles.
  author_name text,
  body text not null check (char_length(btrim(body)) between 1 and 20000),
  is_internal boolean not null default false,
  created_at timestamptz not null default now(),
  check (author_type <> 'client' or is_internal = false)
);

create index ticket_messages_ticket_idx on public.ticket_messages (ticket_id, created_at);

create table public.ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  message_id uuid references public.ticket_messages (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  content_type text,
  size_bytes integer not null check (size_bytes >= 0),
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index ticket_attachments_ticket_idx on public.ticket_attachments (ticket_id);
create index ticket_attachments_message_idx on public.ticket_attachments (message_id);

create table public.ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  from_value text,
  to_value text,
  created_at timestamptz not null default now()
);

create index ticket_events_ticket_idx on public.ticket_events (ticket_id, created_at);

create table public.ticket_watchers (
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ticket_id, user_id)
);

create index ticket_watchers_user_idx on public.ticket_watchers (user_id);

-- ---------------------------------------------------------------------------
-- SLA lookup: workspace policy if set, otherwise the built-in defaults
-- (kept in sync with DEFAULT_SLA_MINUTES in src/lib/glass/constants.ts).
-- ---------------------------------------------------------------------------

create or replace function public.glass_sla_minutes(
  p_org_id uuid,
  p_priority text,
  out first_response integer,
  out resolution integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  select p.first_response_minutes, p.resolution_minutes
  into first_response, resolution
  from public.ticket_sla_policies p
  where p.org_id = p_org_id and p.priority = p_priority;

  if first_response is null then
    first_response := case p_priority
      when 'urgent' then 60
      when 'high' then 240
      when 'normal' then 480
      else 1440
    end;
    resolution := case p_priority
      when 'urgent' then 240
      when 'high' then 1440
      when 'normal' then 4320
      else 7200
    end;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tenancy guard: every reference on a ticket must belong to the same
-- workspace (RLS alone can't stop a staff user in org A from pointing a
-- ticket at a client id they guessed from org B).
-- ---------------------------------------------------------------------------

create or replace function public.glass_assert_ticket_refs(t public.tickets, o public.tickets default null)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  -- Only references that are new or changed are checked, so e.g. a former
  -- staff member still sitting on old tickets doesn't block unrelated edits.
  if t.client_id is not null and t.client_id is distinct from o.client_id and not exists (
    select 1 from public.clients where id = t.client_id and org_id = t.org_id
  ) then
    raise exception 'GLASS: client does not belong to this workspace' using errcode = '23514';
  end if;

  if t.project_id is not null
    and (t.project_id is distinct from o.project_id or t.client_id is distinct from o.client_id)
    and not exists (
      select 1 from public.projects
      where id = t.project_id and org_id = t.org_id
        and (t.client_id is null or client_id = t.client_id)
    ) then
    raise exception 'GLASS: project does not belong to this client/workspace' using errcode = '23514';
  end if;

  if t.category_id is not null and t.category_id is distinct from o.category_id and not exists (
    select 1 from public.ticket_categories where id = t.category_id and org_id = t.org_id
  ) then
    raise exception 'GLASS: category does not belong to this workspace' using errcode = '23514';
  end if;

  if t.assignee_id is not null and t.assignee_id is distinct from o.assignee_id and not exists (
    select 1 from public.org_members where user_id = t.assignee_id and org_id = t.org_id
  ) then
    raise exception 'GLASS: assignee is not a member of this workspace' using errcode = '23514';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- BEFORE INSERT: number, auto-assign, SLA targets
-- ---------------------------------------------------------------------------

create or replace function public.glass_tickets_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next integer;
  v_sla record;
  v_default_assignee uuid;
begin
  new.created_at := now();
  new.updated_at := now();
  new.last_activity_at := now();
  new.subject := btrim(new.subject);
  new.tags := coalesce(new.tags, '{}');

  -- Auto-assignment: category owner first, then the client's Project Manager.
  if new.assignee_id is null and new.category_id is not null then
    select default_assignee_id into v_default_assignee
    from public.ticket_categories
    where id = new.category_id and org_id = new.org_id;
    new.assignee_id := v_default_assignee;
  end if;

  if new.assignee_id is null and new.client_id is not null then
    select c.project_manager_id into v_default_assignee
    from public.clients c
    join public.org_members om on om.user_id = c.project_manager_id and om.org_id = c.org_id
    where c.id = new.client_id and c.org_id = new.org_id;
    new.assignee_id := v_default_assignee;
  end if;

  perform public.glass_assert_ticket_refs(new, null);

  insert into public.ticket_counters (org_id, last_value)
  values (new.org_id, 1001)
  on conflict (org_id) do update set last_value = public.ticket_counters.last_value + 1
  returning last_value into v_next;
  new.ticket_number := 'GLS-' || v_next;

  select * into v_sla from public.glass_sla_minutes(new.org_id, new.priority);
  new.first_response_due_at := new.created_at + make_interval(mins => v_sla.first_response);
  new.resolution_due_at := new.created_at + make_interval(mins => v_sla.resolution);
  new.first_responded_at := null;
  new.sla_paused_seconds := 0;
  new.sla_paused_at := case when new.status in ('pending_client', 'on_hold') then now() else null end;
  new.resolved_at := case when new.status in ('resolved', 'closed') then now() else null end;
  new.closed_at := case when new.status = 'closed' then now() else null end;

  return new;
end;
$$;

create trigger glass_tickets_before_insert
  before insert on public.tickets
  for each row execute function public.glass_tickets_before_insert();

-- ---------------------------------------------------------------------------
-- BEFORE UPDATE: immutables, SLA pause/resume, lifecycle timestamps,
-- priority re-targeting
-- ---------------------------------------------------------------------------

create or replace function public.glass_tickets_before_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paused integer;
  v_sla record;
  v_was_paused boolean := old.status in ('pending_client', 'on_hold');
  v_is_paused boolean := new.status in ('pending_client', 'on_hold');
begin
  new.id := old.id;
  new.org_id := old.org_id;
  new.ticket_number := old.ticket_number;
  new.created_at := old.created_at;
  new.created_by := old.created_by;
  new.channel := old.channel;
  new.updated_at := now();
  new.subject := btrim(new.subject);
  new.tags := coalesce(new.tags, '{}');

  -- SLA and lifecycle columns are owned by this trigger: start from the
  -- previous values and only move them below, whatever the caller sent.
  new.sla_paused_at := old.sla_paused_at;
  new.sla_paused_seconds := old.sla_paused_seconds;
  new.resolved_at := old.resolved_at;
  new.closed_at := old.closed_at;
  new.reopened_count := old.reopened_count;
  new.first_response_due_at := old.first_response_due_at;
  new.resolution_due_at := old.resolution_due_at;
  -- Only the message roll-up (a real public staff reply) may stamp the
  -- first response.
  if coalesce(current_setting('glass.message_rollup', true), '') <> 'on' then
    new.first_responded_at := old.first_responded_at;
  end if;

  -- Signed-in (RLS) writes always record the real actor; service-role writes
  -- (portal actions, API, cron) pass updated_by explicitly.
  if auth.uid() is not null then
    new.updated_by := auth.uid();
  end if;

  perform public.glass_assert_ticket_refs(new, old);

  if new.status is distinct from old.status then
    -- Waiting on the client / on hold stops the SLA clock.
    if v_is_paused and not v_was_paused then
      new.sla_paused_at := now();
    elsif v_was_paused and not v_is_paused then
      if old.sla_paused_at is not null then
        v_paused := greatest(0, extract(epoch from (now() - old.sla_paused_at))::integer);
        new.sla_paused_seconds := old.sla_paused_seconds + v_paused;
        new.resolution_due_at := old.resolution_due_at + make_interval(secs => v_paused);
        if old.first_responded_at is null then
          new.first_response_due_at := old.first_response_due_at + make_interval(secs => v_paused);
        end if;
      end if;
      new.sla_paused_at := null;
    end if;

    if new.status = 'resolved' then
      new.resolved_at := now();
      new.closed_at := null;
    elsif new.status = 'closed' then
      new.closed_at := now();
      new.resolved_at := coalesce(old.resolved_at, now());
    elsif old.status in ('resolved', 'closed') then
      new.reopened_count := old.reopened_count + 1;
      new.resolved_at := null;
      new.closed_at := null;
      new.sla_breach_notified_at := null;
    end if;
  end if;

  if new.priority is distinct from old.priority then
    select * into v_sla from public.glass_sla_minutes(new.org_id, new.priority);
    new.resolution_due_at := old.created_at
      + make_interval(mins => v_sla.resolution)
      + make_interval(secs => new.sla_paused_seconds);
    if new.first_responded_at is null then
      new.first_response_due_at := old.created_at
        + make_interval(mins => v_sla.first_response)
        + make_interval(secs => new.sla_paused_seconds);
    end if;
    new.sla_breach_notified_at := null;
  end if;

  return new;
end;
$$;

create trigger glass_tickets_before_update
  before update on public.tickets
  for each row execute function public.glass_tickets_before_update();

-- ---------------------------------------------------------------------------
-- AFTER INSERT/UPDATE: audit trail
-- ---------------------------------------------------------------------------

create or replace function public.glass_tickets_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
begin
  if tg_op = 'INSERT' then
    insert into public.ticket_events (ticket_id, org_id, actor_id, event_type, to_value)
    values (new.id, new.org_id, coalesce(new.created_by, auth.uid()), 'created', new.status);

    if new.assignee_id is not null then
      insert into public.ticket_events (ticket_id, org_id, actor_id, event_type, to_value)
      values (new.id, new.org_id, coalesce(new.created_by, auth.uid()), 'assignee', new.assignee_id::text);
    end if;
    return new;
  end if;

  v_actor := coalesce(auth.uid(), new.updated_by);

  if new.status is distinct from old.status then
    insert into public.ticket_events (ticket_id, org_id, actor_id, event_type, from_value, to_value)
    values (new.id, new.org_id, v_actor, 'status', old.status, new.status);
  end if;
  if new.priority is distinct from old.priority then
    insert into public.ticket_events (ticket_id, org_id, actor_id, event_type, from_value, to_value)
    values (new.id, new.org_id, v_actor, 'priority', old.priority, new.priority);
  end if;
  if new.assignee_id is distinct from old.assignee_id then
    insert into public.ticket_events (ticket_id, org_id, actor_id, event_type, from_value, to_value)
    values (new.id, new.org_id, v_actor, 'assignee', old.assignee_id::text, new.assignee_id::text);
  end if;
  if new.type is distinct from old.type then
    insert into public.ticket_events (ticket_id, org_id, actor_id, event_type, from_value, to_value)
    values (new.id, new.org_id, v_actor, 'type', old.type, new.type);
  end if;
  if new.category_id is distinct from old.category_id then
    insert into public.ticket_events (ticket_id, org_id, actor_id, event_type, from_value, to_value)
    values (new.id, new.org_id, v_actor, 'category', old.category_id::text, new.category_id::text);
  end if;
  if new.client_id is distinct from old.client_id then
    insert into public.ticket_events (ticket_id, org_id, actor_id, event_type, from_value, to_value)
    values (new.id, new.org_id, v_actor, 'client', old.client_id::text, new.client_id::text);
  end if;
  if new.client_visible is distinct from old.client_visible then
    insert into public.ticket_events (ticket_id, org_id, actor_id, event_type, from_value, to_value)
    values (new.id, new.org_id, v_actor, 'client_visible', old.client_visible::text, new.client_visible::text);
  end if;
  if new.subject is distinct from old.subject then
    insert into public.ticket_events (ticket_id, org_id, actor_id, event_type, from_value, to_value)
    values (new.id, new.org_id, v_actor, 'subject', old.subject, new.subject);
  end if;
  if new.tags is distinct from old.tags then
    insert into public.ticket_events (ticket_id, org_id, actor_id, event_type, from_value, to_value)
    values (new.id, new.org_id, v_actor, 'tags', array_to_string(old.tags, ', '), array_to_string(new.tags, ', '));
  end if;
  if new.satisfaction_rating is distinct from old.satisfaction_rating and new.satisfaction_rating is not null then
    insert into public.ticket_events (ticket_id, org_id, actor_id, event_type, to_value)
    values (new.id, new.org_id, v_actor, 'satisfaction', new.satisfaction_rating::text);
  end if;

  return new;
end;
$$;

create trigger glass_tickets_audit
  after insert or update on public.tickets
  for each row execute function public.glass_tickets_audit();

-- ---------------------------------------------------------------------------
-- Messages: pin org to the ticket's org, then roll activity/first-response/
-- reopen-on-reply onto the ticket.
-- ---------------------------------------------------------------------------

create or replace function public.glass_messages_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket_org uuid;
begin
  select org_id into v_ticket_org from public.tickets where id = new.ticket_id;
  if v_ticket_org is null then
    raise exception 'GLASS: ticket not found' using errcode = '23503';
  end if;
  new.org_id := v_ticket_org;
  new.created_at := now();
  return new;
end;
$$;

create trigger glass_messages_before_insert
  before insert on public.ticket_messages
  for each row execute function public.glass_messages_before_insert();

create or replace function public.glass_messages_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('glass.message_rollup', 'on', true);

  update public.tickets t
  set
    last_activity_at = new.created_at,
    updated_by = coalesce(new.author_id, t.updated_by),
    first_responded_at = case
      when new.author_type = 'staff' and not new.is_internal and t.first_responded_at is null
        then new.created_at
      else t.first_responded_at
    end,
    status = case
      -- A client reply brings a waiting or resolved ticket back into the queue.
      when new.author_type = 'client' and t.status in ('pending_client', 'resolved') then 'open'
      -- First public staff reply triages a brand-new ticket.
      when new.author_type = 'staff' and not new.is_internal and t.status = 'new' then 'open'
      else t.status
    end
  where t.id = new.ticket_id;

  perform set_config('glass.message_rollup', 'off', true);

  insert into public.ticket_events (ticket_id, org_id, actor_id, event_type, to_value)
  values (
    new.ticket_id,
    new.org_id,
    new.author_id,
    case when new.is_internal then 'internal_note' else 'reply' end,
    new.author_type
  );

  return new;
end;
$$;

create trigger glass_messages_after_insert
  after insert on public.ticket_messages
  for each row execute function public.glass_messages_after_insert();

-- Attachments and watchers inherit the ticket's org, whatever the caller sent.
create or replace function public.glass_pin_ticket_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket_org uuid;
begin
  select org_id into v_ticket_org from public.tickets where id = new.ticket_id;
  if v_ticket_org is null then
    raise exception 'GLASS: ticket not found' using errcode = '23503';
  end if;
  new.org_id := v_ticket_org;
  return new;
end;
$$;

create trigger glass_attachments_pin_org
  before insert on public.ticket_attachments
  for each row execute function public.glass_pin_ticket_org();

create trigger glass_watchers_pin_org
  before insert on public.ticket_watchers
  for each row execute function public.glass_pin_ticket_org();

-- Internal helpers: only the triggers (running as the definer) call these.
revoke execute on function public.glass_sla_minutes(uuid, text) from public, anon, authenticated;
revoke execute on function public.glass_assert_ticket_refs(public.tickets, public.tickets) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.ticket_sla_policies enable row level security;
alter table public.ticket_categories enable row level security;
alter table public.ticket_macros enable row level security;
alter table public.ticket_counters enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.ticket_attachments enable row level security;
alter table public.ticket_events enable row level security;
alter table public.ticket_watchers enable row level security;

-- SLA policies: everyone on staff can read; admins change them.
create policy "org members can view ticket SLA policies"
  on public.ticket_sla_policies for select
  using (public.is_org_member(org_id));

create policy "org admins can manage ticket SLA policies"
  on public.ticket_sla_policies for all
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

-- Categories: staff read, admins manage, portal users see active ones to file under.
create policy "org members can view ticket categories"
  on public.ticket_categories for select
  using (public.is_org_member(org_id));

create policy "org admins can manage ticket categories"
  on public.ticket_categories for all
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

create policy "client users can view active ticket categories"
  on public.ticket_categories for select
  using (is_active and public.is_client_portal_org_user(org_id));

-- Macros: staff read, editors manage.
create policy "org members can view ticket macros"
  on public.ticket_macros for select
  using (public.is_org_member(org_id));

create policy "org editors can manage ticket macros"
  on public.ticket_macros for all
  using (public.is_org_editor(org_id))
  with check (public.is_org_editor(org_id));

-- Tickets: staff read; non-viewer staff create/update; admins delete.
create policy "org members can view tickets"
  on public.tickets for select
  using (public.is_org_member(org_id));

create policy "org editors can create tickets"
  on public.tickets for insert
  with check (public.is_org_editor(org_id));

create policy "org editors can update tickets"
  on public.tickets for update
  using (public.is_org_editor(org_id))
  with check (public.is_org_editor(org_id));

create policy "org admins can delete tickets"
  on public.tickets for delete
  using (public.is_org_admin(org_id));

create policy "client users can view their tickets"
  on public.tickets for select
  using (client_visible and client_id is not null and public.is_client_portal_user(client_id));

-- Messages: staff read all; editors post as themselves; clients see only
-- public messages on their own tickets.
create policy "org members can view ticket messages"
  on public.ticket_messages for select
  using (public.is_org_member(org_id));

create policy "org editors can post ticket messages"
  on public.ticket_messages for insert
  with check (
    public.is_org_editor(org_id)
    and author_id = auth.uid()
    and author_type = 'staff'
  );

create policy "org admins can delete ticket messages"
  on public.ticket_messages for delete
  using (public.is_org_admin(org_id));

create policy "client users can view public messages on their tickets"
  on public.ticket_messages for select
  using (
    not is_internal
    and exists (
      select 1 from public.tickets t
      where t.id = ticket_messages.ticket_id
        and t.client_visible
        and t.client_id is not null
        and public.is_client_portal_user(t.client_id)
    )
  );

-- Attachments: same visibility as the message they hang off.
create policy "org members can view ticket attachments"
  on public.ticket_attachments for select
  using (public.is_org_member(org_id));

create policy "org editors can add ticket attachments"
  on public.ticket_attachments for insert
  with check (public.is_org_editor(org_id) and uploaded_by = auth.uid());

create policy "org admins can delete ticket attachments"
  on public.ticket_attachments for delete
  using (public.is_org_admin(org_id));

create policy "client users can view attachments on their tickets"
  on public.ticket_attachments for select
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_attachments.ticket_id
        and t.client_visible
        and t.client_id is not null
        and public.is_client_portal_user(t.client_id)
    )
    and (
      message_id is null
      or exists (
        select 1 from public.ticket_messages m
        where m.id = ticket_attachments.message_id and not m.is_internal
      )
    )
  );

-- Events: staff only, read-only (triggers write them).
create policy "org members can view ticket events"
  on public.ticket_events for select
  using (public.is_org_member(org_id));

-- Watchers: staff manage their own watch; admins manage anyone's.
create policy "org members can view ticket watchers"
  on public.ticket_watchers for select
  using (public.is_org_member(org_id));

create policy "org members can watch tickets"
  on public.ticket_watchers for insert
  with check (public.is_org_member(org_id) and (user_id = auth.uid() or public.is_org_admin(org_id)));

create policy "org members can unwatch tickets"
  on public.ticket_watchers for delete
  using (public.is_org_member(org_id) and (user_id = auth.uid() or public.is_org_admin(org_id)));

-- ---------------------------------------------------------------------------
-- Storage bucket (private; bytes are only reached through the service role
-- after a row-level check, then handed out as a 60-second signed URL)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values ('ticket-attachments', 'ticket-attachments', false, 4194304)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Realtime: ticket pages refresh live (RLS still scopes what each
-- subscriber receives, so clients never get internal notes).
-- ---------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.tickets;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.ticket_messages;
exception when duplicate_object then null;
end $$;
