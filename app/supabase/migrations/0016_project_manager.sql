-- Assign one staff member as a client's Project Manager — shown on the
-- client's profile to staff, and to the client themselves in their portal.

alter table clients
  add column project_manager_id uuid references auth.users (id) on delete set null;

create index clients_project_manager_id_idx on clients (project_manager_id);

-- profiles RLS only ever allowed reading your own row (the "org-mates can
-- read" comment on the original policy was aspirational, not real) — add
-- the two lookups a Project Manager assignment actually needs: org-mates
-- picking each other from a staff list, and a client portal user seeing
-- their assigned PM's name.

create policy "org members can view org-mates profiles"
  on profiles for select
  using (
    exists (
      select 1 from public.org_members om1
      join public.org_members om2 on om1.org_id = om2.org_id
      where om1.user_id = auth.uid() and om2.user_id = profiles.id
    )
  );

create policy "client portal users can view their assigned PM profile"
  on profiles for select
  using (
    exists (
      select 1 from public.clients c
      join public.client_portal_users cpu on cpu.client_id = c.id
      where cpu.id = auth.uid() and c.project_manager_id = profiles.id
    )
  );
