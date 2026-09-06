-- Project Manager role tiers (I/II/III) and a Project Consultant role that
-- assists PM II/III with the heavier lifting on a client engagement.
--
-- This introduces the roles and lets a client be assigned a consultant
-- (mirroring the existing project_manager_id assignment from
-- 0016_project_manager.sql). Portfolio-scoped access — restricting a PM to
-- only the clients they're assigned to — is a separate follow-up migration
-- once the RLS scoping rules are finalized.

alter type org_role add value 'project_manager_i';
alter type org_role add value 'project_manager_ii';
alter type org_role add value 'project_manager_iii';
alter type org_role add value 'project_consultant';

alter table clients
  add column project_consultant_id uuid references auth.users (id) on delete set null;

create index clients_project_consultant_id_idx on clients (project_consultant_id);

-- Mirror the 0016_project_manager.sql client-portal policy so a client can
-- also see the name of the consultant assigned to help their PM.
create policy "client portal users can view their assigned consultant profile"
  on profiles for select
  using (
    exists (
      select 1 from public.clients c
      join public.client_portal_users cpu on cpu.client_id = c.id
      where cpu.id = auth.uid() and c.project_consultant_id = profiles.id
    )
  );
