-- Timecard workflow: batch a client's time entries for a period, get an
-- internal approval (auto-stamped for owners/admins, otherwise held for
-- one), then send a public review link to the client for their approval.

create type timecard_status as enum (
  'draft',
  'internally_approved',
  'sent',
  'client_approved',
  'client_rejected'
);

create table timecards (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  status timecard_status not null default 'draft',
  total_hours numeric(8, 2) not null default 0,
  total_amount numeric(12, 2),

  -- Internal sign-off, before the client ever sees it.
  internal_approval_id text,
  internal_approved_at timestamptz,
  internal_approved_by uuid references auth.users (id) on delete set null,

  -- Client-facing review link and decision.
  approval_token uuid not null default gen_random_uuid(),
  approver_name text,
  approver_email text,
  sent_at timestamptz,
  client_approved_at timestamptz,
  client_approved_by_name text,
  client_rejected_at timestamptz,
  rejection_reason text,

  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index timecards_approval_token_idx on timecards (approval_token);
create index timecards_client_id_idx on timecards (client_id, created_at desc);

alter table time_entries
  add column timecard_id uuid references timecards (id) on delete set null;

create index time_entries_timecard_id_idx on time_entries (timecard_id);

alter table timecards enable row level security;

create policy "org members can manage timecards"
  on timecards for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));
