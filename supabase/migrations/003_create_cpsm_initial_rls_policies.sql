-- CPSM Initial Row Level Security Policy Draft
-- Migration: 003_create_cpsm_initial_rls_policies
-- Purpose: Conservative starter policies for Client Portfolio Service Manager.
-- Status: Review-only draft. Do not apply to Supabase until approved.

-- Important:
-- These policies are intentionally conservative.
-- They are meant to establish the first policy direction, not the complete security model.
-- Engineering Admin is intentionally not treated as a broad internal admin by default.
-- Future sudo access should be temporary, approved, logged, and time-bound through a separate sudo/elevation model.

create or replace function public.current_user_has_role(target_role_key text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.client_user_access cua
    join public.roles r on r.id = cua.role_id
    where cua.user_id = auth.uid()
      and cua.access_status = 'active'
      and r.role_key = target_role_key
  );
$$;

create or replace function public.current_user_is_internal_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.client_user_access cua
    join public.roles r on r.id = cua.role_id
    where cua.user_id = auth.uid()
      and cua.access_status = 'active'
      and r.role_key in ('superuser', 'admin')
  );
$$;

create or replace function public.current_user_has_client_access(target_client_company_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.client_user_access cua
    where cua.user_id = auth.uid()
      and cua.client_company_id = target_client_company_id
      and cua.access_status = 'active'
  );
$$;

drop policy if exists "Users can read their own profile" on public.user_profiles;
create policy "Users can read their own profile"
on public.user_profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Internal admins can read user profiles" on public.user_profiles;
create policy "Internal admins can read user profiles"
on public.user_profiles
for select
to authenticated
using (public.current_user_is_internal_admin());

drop policy if exists "Internal admins can manage user profiles" on public.user_profiles;
create policy "Internal admins can manage user profiles"
on public.user_profiles
for all
to authenticated
using (public.current_user_is_internal_admin())
with check (public.current_user_is_internal_admin());

drop policy if exists "Internal admins can read roles" on public.roles;
create policy "Internal admins can read roles"
on public.roles
for select
to authenticated
using (public.current_user_is_internal_admin());

drop policy if exists "Internal admins can read permissions" on public.permissions;
create policy "Internal admins can read permissions"
on public.permissions
for select
to authenticated
using (public.current_user_is_internal_admin());

drop policy if exists "Internal admins can read role permissions" on public.role_permissions;
create policy "Internal admins can read role permissions"
on public.role_permissions
for select
to authenticated
using (public.current_user_is_internal_admin());

drop policy if exists "Internal admins can read system settings" on public.system_settings;
create policy "Internal admins can read system settings"
on public.system_settings
for select
to authenticated
using (public.current_user_is_internal_admin());

drop policy if exists "Internal admins can manage system settings" on public.system_settings;
create policy "Internal admins can manage system settings"
on public.system_settings
for all
to authenticated
using (public.current_user_is_internal_admin())
with check (public.current_user_is_internal_admin());

drop policy if exists "Users can read assigned client companies" on public.client_companies;
create policy "Users can read assigned client companies"
on public.client_companies
for select
to authenticated
using (public.current_user_has_client_access(id) or public.current_user_is_internal_admin());

drop policy if exists "Internal admins can manage client companies" on public.client_companies;
create policy "Internal admins can manage client companies"
on public.client_companies
for all
to authenticated
using (public.current_user_is_internal_admin())
with check (public.current_user_is_internal_admin());

drop policy if exists "Users can read assigned client access records" on public.client_user_access;
create policy "Users can read assigned client access records"
on public.client_user_access
for select
to authenticated
using (user_id = auth.uid() or public.current_user_is_internal_admin());

drop policy if exists "Internal admins can manage client access records" on public.client_user_access;
create policy "Internal admins can manage client access records"
on public.client_user_access
for all
to authenticated
using (public.current_user_is_internal_admin())
with check (public.current_user_is_internal_admin());

drop policy if exists "Users can read assigned client settings" on public.client_company_settings;
create policy "Users can read assigned client settings"
on public.client_company_settings
for select
to authenticated
using (public.current_user_has_client_access(client_company_id) or public.current_user_is_internal_admin());

drop policy if exists "Internal admins can manage client settings" on public.client_company_settings;
create policy "Internal admins can manage client settings"
on public.client_company_settings
for all
to authenticated
using (public.current_user_is_internal_admin())
with check (public.current_user_is_internal_admin());

drop policy if exists "Users can read assigned projects" on public.projects;
create policy "Users can read assigned projects"
on public.projects
for select
to authenticated
using (public.current_user_has_client_access(client_company_id) or public.current_user_is_internal_admin());

drop policy if exists "Internal admins can manage projects" on public.projects;
create policy "Internal admins can manage projects"
on public.projects
for all
to authenticated
using (public.current_user_is_internal_admin())
with check (public.current_user_is_internal_admin());

drop policy if exists "Users can read assigned workflows" on public.workflows;
create policy "Users can read assigned workflows"
on public.workflows
for select
to authenticated
using (public.current_user_has_client_access(client_company_id) or public.current_user_is_internal_admin());

drop policy if exists "Internal admins can manage workflows" on public.workflows;
create policy "Internal admins can manage workflows"
on public.workflows
for all
to authenticated
using (public.current_user_is_internal_admin())
with check (public.current_user_is_internal_admin());

drop policy if exists "Users can read assigned agreements" on public.agreements;
create policy "Users can read assigned agreements"
on public.agreements
for select
to authenticated
using (public.current_user_has_client_access(client_company_id) or public.current_user_is_internal_admin());

drop policy if exists "Internal admins can manage agreements" on public.agreements;
create policy "Internal admins can manage agreements"
on public.agreements
for all
to authenticated
using (public.current_user_is_internal_admin())
with check (public.current_user_is_internal_admin());

drop policy if exists "Users can read assigned invoices" on public.invoices;
create policy "Users can read assigned invoices"
on public.invoices
for select
to authenticated
using (public.current_user_has_client_access(client_company_id) or public.current_user_is_internal_admin());

drop policy if exists "Internal admins can manage invoices" on public.invoices;
create policy "Internal admins can manage invoices"
on public.invoices
for all
to authenticated
using (public.current_user_is_internal_admin())
with check (public.current_user_is_internal_admin());

drop policy if exists "Internal admins can read audit logs" on public.audit_logs;
create policy "Internal admins can read audit logs"
on public.audit_logs
for select
to authenticated
using (public.current_user_is_internal_admin());

-- Audit logs should eventually be written through controlled backend logic or database functions.
-- Direct insert/update/delete policies are intentionally not included in this first policy draft.
-- Future sudo model should include a separate table such as sudo_access_sessions with approver, reason, scope, expiration, and audit logging.
