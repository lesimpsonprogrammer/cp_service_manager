-- CPSM Sudo Access Model Draft
-- Migration: 004_create_cpsm_sudo_access_model
-- Purpose: Temporary, approved, audited elevated access for approved users.
-- Status: Review-only draft. Do not apply to Supabase until approved.

-- Business rule:
-- 1. Access is requested by a user.
-- 2. Access is approved by a Superuser.
-- 3. Access reason is based on the user request.
-- 4. Scope is granted to manage and/or assist in the absence of a Super Admin or Superuser.
-- 5. Access expires 1 hour from approval.
-- 6. All sudo access activity must be audit logged.

create table if not exists public.sudo_access_sessions (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.user_profiles(id) on delete cascade,
  approved_by uuid references public.user_profiles(id),
  request_reason text not null,
  scope_granted text not null default 'manage_or_assist_absence_super_admin_or_superuser',
  status text not null default 'requested',
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references public.user_profiles(id),
  revocation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sudo_access_sessions_status_check check (
    status in ('requested', 'approved', 'expired', 'revoked', 'denied')
  ),
  constraint sudo_access_sessions_approval_check check (
    (status = 'approved' and approved_by is not null and approved_at is not null and expires_at is not null)
    or status <> 'approved'
  )
);

create index if not exists idx_sudo_access_sessions_requested_by on public.sudo_access_sessions(requested_by);
create index if not exists idx_sudo_access_sessions_approved_by on public.sudo_access_sessions(approved_by);
create index if not exists idx_sudo_access_sessions_status on public.sudo_access_sessions(status);
create index if not exists idx_sudo_access_sessions_expires_at on public.sudo_access_sessions(expires_at);

drop trigger if exists set_sudo_access_sessions_updated_at on public.sudo_access_sessions;
create trigger set_sudo_access_sessions_updated_at
before update on public.sudo_access_sessions
for each row execute function public.set_updated_at();

alter table public.sudo_access_sessions enable row level security;

create or replace function public.current_user_has_active_sudo()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sudo_access_sessions sas
    where sas.requested_by = auth.uid()
      and sas.status = 'approved'
      and sas.approved_at is not null
      and sas.expires_at > now()
  );
$$;

-- This function extends system-level access to approved, active sudo sessions.
-- Superuser/Admin remain normal internal admin roles.
-- Engineering Admin or another user only gains elevated access through an active approved sudo session.
create or replace function public.current_user_is_internal_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select (
    exists (
      select 1
      from public.client_user_access cua
      join public.roles r on r.id = cua.role_id
      where cua.user_id = auth.uid()
        and cua.access_status = 'active'
        and r.role_key in ('superuser', 'admin')
    )
    or public.current_user_has_active_sudo()
  );
$$;

-- Users may request sudo access for themselves only.
drop policy if exists "Users can request their own sudo access" on public.sudo_access_sessions;
create policy "Users can request their own sudo access"
on public.sudo_access_sessions
for insert
to authenticated
with check (
  requested_by = auth.uid()
  and status = 'requested'
  and approved_by is null
  and approved_at is null
  and expires_at is null
  and revoked_at is null
);

-- Users may read their own sudo access requests and sessions.
drop policy if exists "Users can read their own sudo access sessions" on public.sudo_access_sessions;
create policy "Users can read their own sudo access sessions"
on public.sudo_access_sessions
for select
to authenticated
using (requested_by = auth.uid() or public.current_user_has_role('superuser'));

-- Only Superuser may approve, deny, or revoke sudo access sessions.
drop policy if exists "Superusers can manage sudo access sessions" on public.sudo_access_sessions;
create policy "Superusers can manage sudo access sessions"
on public.sudo_access_sessions
for all
to authenticated
using (public.current_user_has_role('superuser'))
with check (public.current_user_has_role('superuser'));

create or replace function public.log_sudo_access_session_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  audit_action text;
  actor_id uuid;
begin
  if tg_op = 'INSERT' then
    audit_action := 'sudo_access_requested';
    actor_id := new.requested_by;
  elsif tg_op = 'UPDATE' then
    if new.status = 'approved' and old.status is distinct from new.status then
      audit_action := 'sudo_access_approved';
      actor_id := new.approved_by;
    elsif new.status = 'revoked' and old.status is distinct from new.status then
      audit_action := 'sudo_access_revoked';
      actor_id := new.revoked_by;
    elsif new.status = 'denied' and old.status is distinct from new.status then
      audit_action := 'sudo_access_denied';
      actor_id := new.approved_by;
    elsif new.status = 'expired' and old.status is distinct from new.status then
      audit_action := 'sudo_access_expired';
      actor_id := new.approved_by;
    else
      audit_action := 'sudo_access_updated';
      actor_id := coalesce(new.approved_by, new.requested_by);
    end if;
  end if;

  insert into public.audit_logs (
    actor_user_id,
    action,
    entity_table,
    entity_id,
    before_value,
    after_value,
    created_at
  ) values (
    actor_id,
    audit_action,
    'sudo_access_sessions',
    new.id,
    case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
    to_jsonb(new),
    now()
  );

  return new;
end;
$$;

drop trigger if exists log_sudo_access_session_change on public.sudo_access_sessions;
create trigger log_sudo_access_session_change
after insert or update on public.sudo_access_sessions
for each row execute function public.log_sudo_access_session_change();

-- Approval implementation note:
-- When a Superuser approves a request, the application should set:
-- status = 'approved'
-- approved_by = current Superuser user id
-- approved_at = now()
-- expires_at = now() + interval '1 hour'
-- scope_granted = 'manage_or_assist_absence_super_admin_or_superuser'
