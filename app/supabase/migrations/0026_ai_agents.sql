-- Governance for AI agent accounts (e.g. Jaren, "Agentic Data Support
-- Expert"). Agents authenticate exactly like any human org member — same
-- auth.users row, same org_members membership — so every existing RLS
-- policy and audit trail (sql_editor_query_log included) still attributes
-- their actions correctly via auth.uid(). This migration:
--
--   1. Lets a profile be labeled with a job title/description and flagged
--      as an agent, so agent accounts are visibly distinct from human staff
--      everywhere they're listed.
--   2. Makes 'sys_admin' (added in 0025) carry the same permissions as
--      'admin' for ordinary org resources — full autonomy, as intended.
--   3. Adds one deliberate guardrail: `agent_autonomy_settings`, a
--      per-org switch for how much autonomy sys_admin agents get. It is
--      readable/writable ONLY by human 'owner'/'admin' roles — the check
--      does not go through is_org_admin(), specifically so a sys_admin
--      agent can never grant itself more autonomy. Defaults to
--      'full_autonomy'. No resource in the app enforces
--      'require_approval' yet (there is no agent-initiated-write feature
--      to gate) — this is the switch that future work will read.
--   4. `is_any_org_admin()` (platform-wide signup approval) intentionally
--      stays human-only — agent autonomy over its own job (data
--      models/dashboards) is not the same as authority to approve new
--      human accounts into the platform.

alter table public.profiles
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists is_agent boolean not null default false;

create or replace function public.is_org_admin(check_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.org_members
    where org_id = check_org_id
      and user_id = auth.uid()
      and role in ('owner', 'admin', 'sys_admin')
  );
$$;

create table public.agent_autonomy_settings (
  org_id uuid primary key references public.organizations (id) on delete cascade,
  autonomy_level text not null default 'full_autonomy'
    check (autonomy_level in ('full_autonomy', 'require_approval')),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.agent_autonomy_settings enable row level security;

-- Deliberately checks org_members directly (owner/admin only) instead of
-- is_org_admin(), which now also passes for sys_admin — an agent must
-- never be able to read or change its own governance switch.
create policy "human org admins can manage agent autonomy settings"
  on public.agent_autonomy_settings for all
  using (
    exists (
      select 1 from public.org_members
      where org_id = agent_autonomy_settings.org_id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.org_members
      where org_id = agent_autonomy_settings.org_id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );
