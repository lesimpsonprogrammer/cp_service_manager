-- Per-org control over which of Jaren CP's duty tags are active. This only
-- toggles which skills are advertised as "on" in his instructions — his
-- identity, security rules, and operating rules stay hardcoded in
-- app/src/lib/jaren/agent.ts and are never editable from here.
--
-- Follows the same guardrail as agent_autonomy_settings (0026): RLS checks
-- org_members directly for human owner/admin roles, not is_org_admin()
-- (which also passes for sys_admin agents) — an agent must never be able
-- to grant itself more duties.

create table public.jaren_agent_settings (
  org_id uuid primary key references public.organizations (id) on delete cascade,
  essential_skills text[] not null default array[
    'data-extraction', 'data-modeling', 'data-automation',
    'design-aesthetics', 'excel-workbooks', 'sql'
  ],
  enhanced_skills text[] not null default array[
    'coding', 'field-mapping', 'business-operations', 'application-design',
    'analytics', 'data-innovation', 'technology-innovation', 'tool-engineering'
  ],
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.jaren_agent_settings enable row level security;

create policy "org members can read jaren agent settings"
  on public.jaren_agent_settings for select
  using (
    exists (
      select 1 from public.org_members
      where org_id = jaren_agent_settings.org_id
        and user_id = auth.uid()
    )
  );

create policy "human org admins can manage jaren agent settings"
  on public.jaren_agent_settings for all
  using (
    exists (
      select 1 from public.org_members
      where org_id = jaren_agent_settings.org_id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.org_members
      where org_id = jaren_agent_settings.org_id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );
