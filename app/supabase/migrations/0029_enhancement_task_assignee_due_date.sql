-- Assignees on the internal task manager aren't necessarily CPSM login
-- accounts (Claude, Codex, Claude Design, and Jaren Atlas are tools/agents
-- on the team, not signed-up users) — so `assignee_id` (an auth.users FK)
-- doesn't fit. Replace it with a plain display-name field. Also adds a due
-- date so the dashboard can surface what's coming up / overdue.

alter table public.enhancement_tasks drop column assignee_id;
alter table public.enhancement_tasks add column assignee text;
alter table public.enhancement_tasks add column due_date date;

create index enhancement_tasks_due_date_idx on public.enhancement_tasks (org_id, due_date)
  where due_date is not null;
