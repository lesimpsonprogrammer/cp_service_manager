-- Lightweight internal task manager: enhancements and changes the team
-- (humans and agents alike) wants to track outside of GitHub. Deliberately
-- separate from `workflow_tasks` (client-facing service workflow steps) —
-- this is for the team's own backlog of app changes.

create type enhancement_task_status as enum ('backlog', 'in_progress', 'done');
create type enhancement_task_priority as enum ('low', 'medium', 'high');

create table public.enhancement_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  description text,
  notes text,
  status enhancement_task_status not null default 'backlog',
  priority enhancement_task_priority not null default 'medium',
  assignee_id uuid references auth.users (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index enhancement_tasks_org_id_idx on public.enhancement_tasks (org_id, status, created_at desc);

alter table public.enhancement_tasks enable row level security;

-- Any org member (human staff or an agent like Jaren) can log and update
-- items — same open collaboration model as docs and workflow definitions.
create policy "org members can view enhancement tasks"
  on public.enhancement_tasks for select
  using (public.is_org_member(org_id));

create policy "org members can create enhancement tasks"
  on public.enhancement_tasks for insert
  with check (public.is_org_member(org_id));

create policy "org members can update enhancement tasks"
  on public.enhancement_tasks for update
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "org members can delete enhancement tasks"
  on public.enhancement_tasks for delete
  using (public.is_org_member(org_id));
