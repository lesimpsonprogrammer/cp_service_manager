-- Tracks when each user's password was last set, so staff and client
-- portal accounts alike can be prompted to rotate it every 30 days.

alter table profiles add column password_updated_at timestamptz not null default now();
alter table client_portal_users add column password_updated_at timestamptz not null default now();
