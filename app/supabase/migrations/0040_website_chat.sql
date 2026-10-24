-- Website chat: the chat bubble on momentumdatasolutions.com
-- (`public/chat-widget.js`) is the main way visitors reach the team.
--
--   * Every chat is a Service Desk ticket with channel 'chat', so the team
--     answers it from the Live Chat inbox (/chat) or the ticket page with the
--     same replies, macros, SLA clock, notifications, and audit trail.
--   * chat_widget_settings  one row per workspace: the public widget key the
--                           site embeds, on/off, title/greeting/color, who
--                           new chats go to, and which sites may embed it
--   * chat_sessions         one row per chat: the visitor's browser holds a
--                           random token and only its SHA-256 hash is stored
--
-- Visitors have no Supabase session. Every visitor read/write goes through
-- /api/chat/* with the service role after the token check, so these tables
-- have no anon policies at all.
--
-- Safe to run more than once.

begin;

-- Stop early, before changing anything, if this is the wrong project.
do $$
begin
  if to_regclass('public.tickets') is null or to_regprocedure('public.service_desk_tickets_before_insert()') is null then
    raise exception 'Wrong project: run this in the CP Service Manager Supabase project (lesimpsonprogrammer''s Project, ucuejofewehpuxcwvubu) after 0039_service_desk_rename.sql.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Tickets can now arrive from the website chat.
-- ---------------------------------------------------------------------------

alter table public.tickets drop constraint if exists tickets_channel_check;
alter table public.tickets
  add constraint tickets_channel_check check (channel in ('portal', 'staff', 'email', 'api', 'chat'));

-- ---------------------------------------------------------------------------
-- Widget settings
-- ---------------------------------------------------------------------------

create table if not exists public.chat_widget_settings (
  org_id uuid primary key references public.organizations (id) on delete cascade,
  -- Public: it sits in the site's HTML. It only identifies the workspace.
  widget_key text not null unique
    default ('cw_' || replace(gen_random_uuid()::text, '-', ''))
    check (widget_key ~ '^[A-Za-z0-9_-]{6,64}$'),
  is_enabled boolean not null default false,
  title text not null default 'Chat with us'
    check (char_length(btrim(title)) between 1 and 60),
  greeting text not null default 'Hi! Ask us anything. We''ll reply right here, and by email if you''ve stepped away.'
    check (char_length(btrim(greeting)) between 1 and 500),
  accent_color text not null default '#1f6feb' check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  -- Who new chats are assigned to (and so who gets the email). Empty means
  -- the workspace owner.
  default_assignee_id uuid references auth.users (id) on delete set null,
  -- Sites allowed to embed the widget, e.g. https://www.example.com. Empty
  -- means any site.
  allowed_origins text[] not null default '{}',
  -- Where reply emails send the visitor back to (the widget reopens there).
  site_url text check (site_url is null or site_url ~ '^https?://'),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.chat_widget_settings enable row level security;

drop policy if exists "org members can view chat widget settings" on public.chat_widget_settings;
create policy "org members can view chat widget settings"
  on public.chat_widget_settings for select
  using (public.is_org_member(org_id));

drop policy if exists "org admins can manage chat widget settings" on public.chat_widget_settings;
create policy "org admins can manage chat widget settings"
  on public.chat_widget_settings for all
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

-- ---------------------------------------------------------------------------
-- Chat sessions (one per website conversation)
-- ---------------------------------------------------------------------------

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  ticket_id uuid not null unique references public.tickets (id) on delete cascade,
  token_hash text not null unique,
  visitor_name text check (char_length(visitor_name) <= 120),
  visitor_email text not null check (char_length(visitor_email) <= 254),
  page_url text check (char_length(page_url) <= 2000),
  user_agent text check (char_length(user_agent) <= 500),
  -- Salted hash, only used to rate-limit new chats per visitor.
  ip_hash text,
  -- Bumped while the widget is open; "online" in the inbox.
  last_seen_at timestamptz not null default now(),
  -- Throttles "visitor wrote again" emails to the team.
  staff_notified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists chat_sessions_org_seen_idx on public.chat_sessions (org_id, last_seen_at desc);
create index if not exists chat_sessions_ip_created_idx on public.chat_sessions (ip_hash, created_at desc);

alter table public.chat_sessions enable row level security;

drop policy if exists "org members can view chat sessions" on public.chat_sessions;
create policy "org members can view chat sessions"
  on public.chat_sessions for select
  using (public.is_org_member(org_id));

-- The session's workspace is always the ticket's, whatever the caller sent.
drop trigger if exists chat_sessions_pin_org on public.chat_sessions;
create trigger chat_sessions_pin_org
  before insert on public.chat_sessions
  for each row execute function public.service_desk_pin_ticket_org();

-- ---------------------------------------------------------------------------
-- Turn it on for the Cloud Performance workspace, with the key that
-- momentumdatasolutions.com embeds. Leaves an existing row alone.
-- ---------------------------------------------------------------------------

insert into public.chat_widget_settings (org_id, widget_key, is_enabled, title, greeting, allowed_origins, site_url)
select
  o.id,
  'mds-website',
  true,
  'Chat with Momentum Data',
  'Hi! Ask us anything about your data, HR, or payroll. We''ll reply right here, and by email if you''ve stepped away.',
  array['https://momentumdatasolutions.com', 'https://www.momentumdatasolutions.com'],
  'https://www.momentumdatasolutions.com'
from public.organizations o
where o.id = 'aa62d6f2-a219-4521-a6f7-791982e2d5dd'
on conflict (org_id) do nothing;

select 'Website chat applied' as result;

commit;
