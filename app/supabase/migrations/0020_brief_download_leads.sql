-- Email-gate lead capture for the "Executive Brief" download on the public
-- marketing site (momentumdatasolutions.com) and the app landing page
-- (app.cpservicemanager.com). Written only by the /api/brief-lead serverless
-- function using the service-role key (RLS blocks anon/authenticated
-- access entirely, so there is no public read or write policy here).

create table brief_download_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'executive-brief',
  created_at timestamptz not null default now()
);

create unique index brief_download_leads_email_idx on brief_download_leads (lower(email));

alter table brief_download_leads enable row level security;
