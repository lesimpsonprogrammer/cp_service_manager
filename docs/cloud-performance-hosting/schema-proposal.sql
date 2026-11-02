-- Cloud Performance Hosting & Deployment - PROPOSED PostgreSQL/Neon schema
-- Review against existing CPSM org/auth tables before running. NOT APPLIED.
-- Requires pgcrypto for gen_random_uuid(). All rows are scoped to owning organization.
CREATE SCHEMA IF NOT EXISTS hosting;

CREATE TABLE hosting.projects (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL,
 name text NOT NULL,
 slug text NOT NULL,
 repo_provider text NOT NULL DEFAULT 'github',
 repo_full_name text NOT NULL,
 created_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(organization_id,slug)
);
CREATE TABLE hosting.environments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL,
 project_id uuid NOT NULL REFERENCES hosting.projects(id) ON DELETE RESTRICT,
 name text NOT NULL CHECK (name IN ('development','staging','production')),
 requires_approval boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(project_id,name)
);
CREATE TABLE hosting.provider_targets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL,
 environment_id uuid NOT NULL REFERENCES hosting.environments(id) ON DELETE RESTRICT,
 provider text NOT NULL CHECK (provider IN ('cloudflare','vercel','railway','mds')),
 external_project_id text,
 credentials_secret_ref text, -- vault reference only; never token material
 enabled boolean NOT NULL DEFAULT true,
 primary_target boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE hosting.artifacts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL,
 sha256 text NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
 object_key text NOT NULL,
 sbom_object_key text,
 provenance_object_key text,
 size_bytes bigint NOT NULL CHECK (size_bytes>=0),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(organization_id,sha256)
);
CREATE TABLE hosting.deployments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL,
 environment_id uuid NOT NULL REFERENCES hosting.environments(id) ON DELETE RESTRICT,
 requested_by uuid NOT NULL,
 idempotency_key text NOT NULL,
 git_commit_sha text NOT NULL CHECK (git_commit_sha ~ '^[a-fA-F0-9]{40}$'),
 git_ref text NOT NULL,
 artifact_id uuid REFERENCES hosting.artifacts(id),
 status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','building','testing','staged','awaiting_approval','deploying','verifying','succeeded','failed','cancelled','rolled_back')),
 approved_by uuid,
 approved_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz,
 UNIQUE(organization_id,environment_id,idempotency_key)
);
CREATE TABLE hosting.deployment_targets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL,
 deployment_id uuid NOT NULL REFERENCES hosting.deployments(id),
 provider_target_id uuid NOT NULL REFERENCES hosting.provider_targets(id),
 external_deployment_id text,
 status text NOT NULL DEFAULT 'queued',
 deployed_commit_sha text,
 deployment_url text,
 started_at timestamptz,
 finished_at timestamptz,
 UNIQUE(deployment_id,provider_target_id)
);
CREATE TABLE hosting.deployment_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 organization_id uuid NOT NULL,
 deployment_id uuid NOT NULL REFERENCES hosting.deployments(id),
 event_type text NOT NULL,
 event_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
 actor_id uuid,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE hosting.webhook_receipts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL,
 provider text NOT NULL,
 delivery_id text NOT NULL,
 signature_verified boolean NOT NULL DEFAULT false,
 processed_at timestamptz,
 received_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(provider,delivery_id)
);
CREATE INDEX hosting_deployments_recent ON hosting.deployments(organization_id,created_at DESC);
CREATE INDEX hosting_target_status ON hosting.deployment_targets(organization_id,provider_target_id,status);
CREATE INDEX hosting_events_recent ON hosting.deployment_events(organization_id,created_at DESC);
CREATE INDEX hosting_webhook_recent ON hosting.webhook_receipts(received_at);

-- Defense-in-depth: scope all queries with authenticated organization membership.
-- WARNING: do not enable policies until integration with the actual CPSM
-- identity/organization membership schema is defined and tested.
ALTER TABLE hosting.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosting.environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosting.provider_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosting.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosting.deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosting.deployment_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosting.deployment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosting.webhook_receipts ENABLE ROW LEVEL SECURITY;
-- No policies = deny for application roles without BYPASSRLS.
-- TODO CPHD-101: add organization membership-backed SELECT/INSERT/UPDATE policies,
-- with WITH CHECK, non-bypass roles, cross-parent org consistency and tests.
-- TODO CPHD-102: immutable events and deployment transition enforcement through
-- restricted stored procedures; avoid arbitrary status updates.
-- TODO CPHD-103: transactional outbox/job queue; verify exactly-once effects via
-- idempotency even when worker execution is at-least-once.
-- TODO CPHD-104: constrain parent-child organization IDs with composite FKs.
