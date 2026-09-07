-- Jaren chat history: conversations are private to the user who started
-- them (not shared org-wide like data_sources/pipelines), so RLS scopes
-- on user_id rather than is_org_member().

create table jaren_conversations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New conversation',
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jaren_conversations_user_id_idx on jaren_conversations (user_id, updated_at desc);

create table jaren_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references jaren_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index jaren_messages_conversation_id_idx on jaren_messages (conversation_id, created_at);

alter table jaren_conversations enable row level security;
alter table jaren_messages enable row level security;

create policy "users can manage their own jaren conversations"
  on jaren_conversations for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users can manage messages in their own jaren conversations"
  on jaren_messages for all
  using (
    exists (
      select 1 from public.jaren_conversations
      where id = jaren_messages.conversation_id and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.jaren_conversations
      where id = jaren_messages.conversation_id and user_id = auth.uid()
    )
  );
