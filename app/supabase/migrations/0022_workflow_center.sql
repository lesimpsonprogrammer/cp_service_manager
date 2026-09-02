-- Workflow Center: a general-purpose workflow engine so any business
-- process (onboarding, approvals, service requests, etc.) can be modeled
-- as a definition of ordered stages, run as instances, and worked through
-- assignable tasks — instead of every process needing its own bespoke
-- status column.

create type workflow_instance_status as enum ('active', 'completed', 'cancelled');
create type workflow_task_status as enum ('pending', 'in_progress', 'done', 'skipped');

create table workflow_definitions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workflow_definitions_org_id_idx on workflow_definitions (org_id);

create table workflow_stages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  workflow_definition_id uuid not null references workflow_definitions (id) on delete cascade,
  name text not null,
  position integer not null,
  sla_hours integer,
  created_at timestamptz not null default now()
);

create index workflow_stages_org_id_idx on workflow_stages (org_id);
create index workflow_stages_definition_id_idx on workflow_stages (workflow_definition_id);
create unique index workflow_stages_definition_position_idx
  on workflow_stages (workflow_definition_id, position);

create table workflow_instances (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  workflow_definition_id uuid not null references workflow_definitions (id) on delete cascade,
  current_stage_id uuid references workflow_stages (id) on delete set null,
  title text not null,
  subject_type text,
  subject_id uuid,
  status workflow_instance_status not null default 'active',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index workflow_instances_org_id_idx on workflow_instances (org_id);
create index workflow_instances_definition_id_idx on workflow_instances (workflow_definition_id);
create index workflow_instances_current_stage_idx on workflow_instances (current_stage_id);
create index workflow_instances_status_idx on workflow_instances (status);

create table workflow_instance_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  workflow_instance_id uuid not null references workflow_instances (id) on delete cascade,
  from_stage_id uuid references workflow_stages (id) on delete set null,
  to_stage_id uuid references workflow_stages (id) on delete set null,
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index workflow_instance_events_org_id_idx on workflow_instance_events (org_id);
create index workflow_instance_events_instance_id_idx on workflow_instance_events (workflow_instance_id);

create table workflow_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  workflow_instance_id uuid not null references workflow_instances (id) on delete cascade,
  stage_id uuid references workflow_stages (id) on delete set null,
  title text not null,
  description text,
  assignee_id uuid references auth.users (id) on delete set null,
  status workflow_task_status not null default 'pending',
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workflow_tasks_org_id_idx on workflow_tasks (org_id);
create index workflow_tasks_instance_id_idx on workflow_tasks (workflow_instance_id);
create index workflow_tasks_assignee_idx on workflow_tasks (assignee_id);
create index workflow_tasks_status_idx on workflow_tasks (status);

alter table workflow_definitions enable row level security;
alter table workflow_stages enable row level security;
alter table workflow_instances enable row level security;
alter table workflow_instance_events enable row level security;
alter table workflow_tasks enable row level security;

create policy "org members can manage workflow definitions"
  on workflow_definitions for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "org members can manage workflow stages"
  on workflow_stages for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "org members can manage workflow instances"
  on workflow_instances for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "org members can manage workflow instance events"
  on workflow_instance_events for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "org members can manage workflow tasks"
  on workflow_tasks for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));
