-- Service Desk rename. The ticketing system added in 0038 is CP Service
-- Manager's own client Service Desk. "GLASS" is a separate app (Global
-- Security) that CPSM reports to, so the CPSM-side names stop using it:
--
--   * ticket numbers for new tickets: SD-1001, SD-1002, ... (were GLS-...)
--   * glass_* functions and triggers -> service_desk_* (same logic as 0038)
--   * trigger error prefix "GLASS: " -> "SERVICE_DESK: " (the app reads it)
--   * trigger functions are no longer executable by API roles. Postgres
--     won't run a trigger function outside its trigger anyway; this clears
--     the Supabase security advisor warning.
--
-- Tables, columns, policies, the storage bucket and the per-workspace
-- counter are unchanged. Safe to run before or after any tickets exist, and
-- safe to run more than once.

begin;

-- Stop early, before changing anything, if this is the wrong project.
do $$
begin
  if to_regclass('public.tickets') is null or to_regclass('public.ticket_counters') is null then
    raise exception 'Wrong project: run this in the CP Service Manager Supabase project (lesimpsonprogrammer''s Project, ucuejofewehpuxcwvubu) after 0038_glass_ticketing.sql.';
  end if;
end $$;

drop trigger if exists glass_tickets_before_insert on public.tickets;
drop trigger if exists glass_tickets_before_update on public.tickets;
drop trigger if exists glass_tickets_audit on public.tickets;
drop trigger if exists glass_messages_before_insert on public.ticket_messages;
drop trigger if exists glass_messages_after_insert on public.ticket_messages;
drop trigger if exists glass_attachments_pin_org on public.ticket_attachments;
drop trigger if exists glass_watchers_pin_org on public.ticket_watchers;

-- Re-runnable: clear this migration's own triggers too before recreating them.
drop trigger if exists service_desk_tickets_before_insert on public.tickets;
drop trigger if exists service_desk_tickets_before_update on public.tickets;
drop trigger if exists service_desk_tickets_audit on public.tickets;
drop trigger if exists service_desk_messages_before_insert on public.ticket_messages;
drop trigger if exists service_desk_messages_after_insert on public.ticket_messages;
drop trigger if exists service_desk_attachments_pin_org on public.ticket_attachments;
drop trigger if exists service_desk_watchers_pin_org on public.ticket_watchers;

drop function if exists public.glass_tickets_before_insert();
drop function if exists public.glass_tickets_before_update();
drop function if exists public.glass_tickets_audit();
drop function if exists public.glass_messages_before_insert();
drop function if exists public.glass_messages_after_insert();
drop function if exists public.glass_pin_ticket_org();
drop function if exists public.glass_assert_ticket_refs(public.tickets, public.tickets);
drop function if exists public.glass_sla_minutes(uuid, text);

-- ---------------------------------------------------------------------------
-- SLA lookup: workspace policy if set, otherwise the built-in defaults
-- (kept in sync with DEFAULT_SLA_MINUTES in src/lib/service-desk/constants.ts).
-- ---------------------------------------------------------------------------

create or replace function public.service_desk_sla_minutes(
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

create or replace function public.service_desk_assert_ticket_refs(t public.tickets, o public.tickets default null)
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
    raise exception 'SERVICE_DESK: client does not belong to this workspace' using errcode = '23514';
  end if;

  if t.project_id is not null
    and (t.project_id is distinct from o.project_id or t.client_id is distinct from o.client_id)
    and not exists (
      select 1 from public.projects
      where id = t.project_id and org_id = t.org_id
        and (t.client_id is null or client_id = t.client_id)
    ) then
    raise exception 'SERVICE_DESK: project does not belong to this client/workspace' using errcode = '23514';
  end if;

  if t.category_id is not null and t.category_id is distinct from o.category_id and not exists (
    select 1 from public.ticket_categories where id = t.category_id and org_id = t.org_id
  ) then
    raise exception 'SERVICE_DESK: category does not belong to this workspace' using errcode = '23514';
  end if;

  if t.assignee_id is not null and t.assignee_id is distinct from o.assignee_id and not exists (
    select 1 from public.org_members where user_id = t.assignee_id and org_id = t.org_id
  ) then
    raise exception 'SERVICE_DESK: assignee is not a member of this workspace' using errcode = '23514';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- BEFORE INSERT: number, auto-assign, SLA targets
-- ---------------------------------------------------------------------------

create or replace function public.service_desk_tickets_before_insert()
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

  perform public.service_desk_assert_ticket_refs(new, null);

  insert into public.ticket_counters (org_id, last_value)
  values (new.org_id, 1001)
  on conflict (org_id) do update set last_value = public.ticket_counters.last_value + 1
  returning last_value into v_next;
  new.ticket_number := 'SD-' || v_next;

  select * into v_sla from public.service_desk_sla_minutes(new.org_id, new.priority);
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

create trigger service_desk_tickets_before_insert
  before insert on public.tickets
  for each row execute function public.service_desk_tickets_before_insert();

-- ---------------------------------------------------------------------------
-- BEFORE UPDATE: immutables, SLA pause/resume, lifecycle timestamps,
-- priority re-targeting
-- ---------------------------------------------------------------------------

create or replace function public.service_desk_tickets_before_update()
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
  if coalesce(current_setting('service_desk.message_rollup', true), '') <> 'on' then
    new.first_responded_at := old.first_responded_at;
  end if;

  -- Signed-in (RLS) writes always record the real actor; service-role writes
  -- (portal actions, API, cron) pass updated_by explicitly.
  if auth.uid() is not null then
    new.updated_by := auth.uid();
  end if;

  perform public.service_desk_assert_ticket_refs(new, old);

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
    select * into v_sla from public.service_desk_sla_minutes(new.org_id, new.priority);
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

create trigger service_desk_tickets_before_update
  before update on public.tickets
  for each row execute function public.service_desk_tickets_before_update();

-- ---------------------------------------------------------------------------
-- AFTER INSERT/UPDATE: audit trail
-- ---------------------------------------------------------------------------

create or replace function public.service_desk_tickets_audit()
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

create trigger service_desk_tickets_audit
  after insert or update on public.tickets
  for each row execute function public.service_desk_tickets_audit();

-- ---------------------------------------------------------------------------
-- Messages: pin org to the ticket's org, then roll activity/first-response/
-- reopen-on-reply onto the ticket.
-- ---------------------------------------------------------------------------

create or replace function public.service_desk_messages_before_insert()
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
    raise exception 'SERVICE_DESK: ticket not found' using errcode = '23503';
  end if;
  new.org_id := v_ticket_org;
  new.created_at := now();
  return new;
end;
$$;

create trigger service_desk_messages_before_insert
  before insert on public.ticket_messages
  for each row execute function public.service_desk_messages_before_insert();

create or replace function public.service_desk_messages_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('service_desk.message_rollup', 'on', true);

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

  perform set_config('service_desk.message_rollup', 'off', true);

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

create trigger service_desk_messages_after_insert
  after insert on public.ticket_messages
  for each row execute function public.service_desk_messages_after_insert();

-- Attachments and watchers inherit the ticket's org, whatever the caller sent.
create or replace function public.service_desk_pin_ticket_org()
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
    raise exception 'SERVICE_DESK: ticket not found' using errcode = '23503';
  end if;
  new.org_id := v_ticket_org;
  return new;
end;
$$;

create trigger service_desk_attachments_pin_org
  before insert on public.ticket_attachments
  for each row execute function public.service_desk_pin_ticket_org();

create trigger service_desk_watchers_pin_org
  before insert on public.ticket_watchers
  for each row execute function public.service_desk_pin_ticket_org();

-- Internal helpers: only the triggers (running as the definer) call these.
revoke execute on function public.service_desk_sla_minutes(uuid, text) from public, anon, authenticated;
revoke execute on function public.service_desk_assert_ticket_refs(public.tickets, public.tickets) from public, anon, authenticated;

revoke execute on function public.service_desk_tickets_before_insert() from public, anon, authenticated;
revoke execute on function public.service_desk_tickets_before_update() from public, anon, authenticated;
revoke execute on function public.service_desk_tickets_audit() from public, anon, authenticated;
revoke execute on function public.service_desk_messages_before_insert() from public, anon, authenticated;
revoke execute on function public.service_desk_messages_after_insert() from public, anon, authenticated;
revoke execute on function public.service_desk_pin_ticket_org() from public, anon, authenticated;

select 'Service Desk rename applied' as result;

commit;
