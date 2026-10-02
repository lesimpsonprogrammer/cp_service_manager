-- Artifact Management — a versioned file store for everything MDS produces or
-- receives (signed contracts, payroll registers, client uploads, pipeline
-- exports, Power BI files, SQL scripts, brand assets, backups ...), modeled on
-- the HPE Cray System Management (CSM) "Artifact Management" S3 service:
--
--   * Named buckets per workspace, with a seeded set of MDS system buckets
--     (like CSM's boot-images / ims / sat ...) plus custom ones admins add.
--   * Objects addressed by bucket + key (e.g. `acme/2026/q3-register.xlsx`).
--     Re-uploading the same key creates a new version; older versions stay
--     downloadable until deleted.
--   * Bytes live in ONE private Supabase Storage bucket, `artifacts`, under
--     `<org_id>/<artifact_id>/<file name>`. Storage has no policies for
--     anon/authenticated users on purpose — every read/write goes through
--     the app server (service role) after the RLS-protected rows below have
--     confirmed the caller belongs to the org. Downloads and share links are
--     short-lived signed URLs (CSM's "temporary S3 credentials").

-- ---------------------------------------------------------------------------
-- Storage bucket (private)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('artifacts', 'artifacts', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Role helper: everyone in the org except read-only viewers can write.
-- ---------------------------------------------------------------------------

create or replace function public.is_org_editor(check_org_id uuid)
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
      and role <> 'viewer'
  );
$$;

-- ---------------------------------------------------------------------------
-- Buckets
-- ---------------------------------------------------------------------------

create table public.artifact_buckets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  -- S3-style name: 3-63 chars, lowercase letters, digits, and hyphens.
  name text not null check (name ~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$'),
  description text not null default '',
  is_system boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

create index artifact_buckets_org_id_idx on public.artifact_buckets (org_id);

alter table public.artifact_buckets enable row level security;

create policy "org members can view artifact buckets"
  on public.artifact_buckets for select
  using (public.is_org_member(org_id));

create policy "org admins can create artifact buckets"
  on public.artifact_buckets for insert
  with check (public.is_org_admin(org_id));

create policy "org admins can update artifact buckets"
  on public.artifact_buckets for update
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

-- System buckets are part of the MDS layout and can't be removed.
create policy "org admins can delete custom artifact buckets"
  on public.artifact_buckets for delete
  using (public.is_org_admin(org_id) and not is_system);

-- ---------------------------------------------------------------------------
-- Artifacts (one row per object version)
-- ---------------------------------------------------------------------------

create table public.artifacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  -- NO ACTION (not cascade): a bucket can't be dropped while it still holds
  -- artifacts, but an org delete still cascades through both tables.
  bucket_id uuid not null references public.artifact_buckets (id),
  key text not null check (char_length(key) between 1 and 512),
  version integer not null default 1 check (version >= 1),
  is_latest boolean not null default false,
  -- 'pending' until the browser/API client finishes the direct-to-storage
  -- upload and the app confirms the object exists.
  status text not null default 'pending' check (status in ('pending', 'available')),
  file_name text not null,
  content_type text not null default 'application/octet-stream',
  size_bytes bigint not null default 0,
  checksum_sha256 text,
  description text not null default '',
  tags text[] not null default '{}',
  client_id uuid references public.clients (id) on delete set null,
  storage_path text not null unique,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket_id, key, version)
);

create index artifacts_org_id_idx on public.artifacts (org_id);
create index artifacts_bucket_latest_idx on public.artifacts (bucket_id, key) where is_latest;
create index artifacts_client_id_idx on public.artifacts (client_id) where client_id is not null;
create index artifacts_tags_idx on public.artifacts using gin (tags);

alter table public.artifacts enable row level security;

create policy "org members can view artifacts"
  on public.artifacts for select
  using (public.is_org_member(org_id));

create policy "org editors can add artifacts"
  on public.artifacts for insert
  with check (public.is_org_editor(org_id));

create policy "org editors can update artifacts"
  on public.artifacts for update
  using (public.is_org_editor(org_id))
  with check (public.is_org_editor(org_id));

create policy "org editors can delete artifacts"
  on public.artifacts for delete
  using (public.is_org_editor(org_id));

-- Per-bucket totals for the Artifacts overview. security_invoker so the
-- caller's RLS on both tables applies — a member only sees their own org.
create view public.artifact_bucket_stats
with (security_invoker = true) as
select
  b.id as bucket_id,
  b.org_id,
  count(a.id) filter (where a.is_latest)::bigint as object_count,
  count(a.id)::bigint as version_count,
  coalesce(sum(a.size_bytes), 0)::bigint as total_bytes,
  max(a.created_at) as last_upload_at
from public.artifact_buckets b
left join public.artifacts a
  on a.bucket_id = b.id and a.status = 'available'
group by b.id, b.org_id;

-- ---------------------------------------------------------------------------
-- Default MDS buckets — seeded for every new org, and backfilled below.
-- ---------------------------------------------------------------------------

create or replace function public.seed_artifact_buckets(p_org_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.artifact_buckets (org_id, name, description, is_system)
  values
    (p_org_id, 'contracts',           'Signed agreements, SOWs, amendments, and business agreements.', true),
    (p_org_id, 'invoices',            'Invoice PDFs, billing backup, and payment confirmations.', true),
    (p_org_id, 'client-uploads',      'Raw files received from clients — census files, registers, system exports.', true),
    (p_org_id, 'client-deliverables', 'Cleaned files, workbooks, and reports delivered back to clients.', true),
    (p_org_id, 'payroll',             'Payroll registers, tax filings, and year-end (W-2 / 1099) packages.', true),
    (p_org_id, 'hr-consulting',       'Handbooks, policies, job descriptions, and compliance documents.', true),
    (p_org_id, 'pipeline-exports',    'ETL pipeline outputs, extracts, and load files.', true),
    (p_org_id, 'reports',             'Power BI files, dashboards, and Excel models.', true),
    (p_org_id, 'sql-scripts',         'Data Studio queries, migrations, and SQL builder SOWs.', true),
    (p_org_id, 'templates',           'Agreement, onboarding, and data-import templates.', true),
    (p_org_id, 'brand-assets',        'Logos, decks, and marketing collateral.', true),
    (p_org_id, 'backups',             'Database dumps and configuration snapshots.', true),
    (p_org_id, 'agents',              'Files produced or consumed by AI agents (Jaren and team).', true)
  on conflict (org_id, name) do nothing;
$$;

-- Only the trigger below and this migration call it — not exposed over RPC.
revoke execute on function public.seed_artifact_buckets(uuid) from public, anon, authenticated;

create or replace function public.handle_new_org_artifact_buckets()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_artifact_buckets(new.id);
  return new;
end;
$$;

create trigger organizations_seed_artifact_buckets
  after insert on public.organizations
  for each row execute function public.handle_new_org_artifact_buckets();

select public.seed_artifact_buckets(id) from public.organizations;
