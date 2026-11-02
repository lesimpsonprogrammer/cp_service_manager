# Cloud Performance Hosting & Deployment (CPHD)

**Status:** Architecture proposal (not deployed). **Parent:** Cloud Performance Service Manager (CPSM). **Oversight:** GLASS.

## Vision
Build a secure MDS-controlled deployment and hosting platform. First orchestrate Vercel, Cloudflare and Railway from GitHub, then introduce isolated MDS build runners, immutable artifact storage and eventually MDS-operated hosting nodes. Live customer services remain on existing providers during initial development.

## Architecture
GitHub App + verified webhooks -> CPSM deployment control plane -> durable queue -> isolated runners -> signed/content-addressed artifacts -> provider adapters (Cloudflare/Vercel/Railway) or self-hosted cluster -> health verification -> optional traffic cutover. GLASS consumes security/health/audit events.

## MVP capabilities
- Organization- and project-scoped access; RBAC; PostgreSQL RLS; tenant isolation.
- Projects, environment config, provider targets, deployment request, pipeline stages, immutable deployment history.
- GitHub repository and commit source tracking; idempotent webhook ingestion with signature verification and replay protection.
- Provider adapters with credential vault references; per-provider rate limits, retries, drift detection and status.
- Approvals for production; check-based release gating; artifacts verified before publishing.
- Monitoring: commit parity across providers, availability checks, alert dispatch to GLASS.
- No direct change to production DNS without explicit approval and rollback record.

## Milestones
| Phase | Deliverable | Exit gate |
| --- | --- | --- |
| CPHD-0 | Architecture, threat model, schema and legal policy workstream | Reviewed design |
| CPHD-1 | Project/environment UI, RBAC, database, audit log | Tests including cross-tenant denial |
| CPHD-2 | GitHub webhooks and deployment queue | Replay/duplicate tests pass |
| CPHD-3 | Cloudflare + Vercel adapters and commit-drift dashboard | MDS site deployed to staging on both |
| CPHD-4 | Railway adapter, secrets vault, approvals, rollback | Verified controlled rollback |
| CPHD-5 | Ephemeral isolated build workers and artifact registry | Artifact provenance and runner isolation validated |
| CPHD-6 | Self-hosted static site pilot with TLS/monitoring | Recovery drill and external security review |
| CPHD-7 | Container hosting pilot, quotas, tenant billing | Performance, abuse and resilience review |

## Security boundaries
Never execute untrusted builds inside the CPSM API process. No shared privileged Docker socket; runners are ephemeral and least-privileged. No plaintext provider tokens in database/logs. Require explicit authorization for production deployments and domain moves, signed/replay-protected webhook events, append-only audit logging, and tested restore/rollback.

## Proposed REST surface
- GET/POST /api/hosting/projects
- GET/POST /api/hosting/projects/:id/environments
- POST /api/hosting/environments/:id/deployments (Idempotency-Key required)
- GET /api/hosting/deployments/:id
- POST /api/hosting/deployments/:id/cancel
- POST /api/hosting/deployments/:id/approve
- POST /api/hosting/deployments/:id/rollback
- GET /api/hosting/projects/:id/provider-status
- POST /api/webhooks/github (signature and replay validation)

## Policy and legal readiness (referencing Cloudflare's public agreement)
Cloudflare's self-serve subscription agreement is a **benchmark only**, not wording to reproduce. MDS needs original, counsel-reviewed terms tailored to its actual services:
- Hosting & Deployment Service Agreement: ordering, permitted uses, subscriptions, renewals, cancellation, support, incident roles, termination.
- Acceptable Use and Abuse Response Policy: unlawful content, spam, phishing, malware, misuse, investigation, notice and suspension.
- Data Processing Addendum (where appropriate): processing roles, data types, security commitments, subprocessors, cross-border transfers and deletion/return.
- Information Security & Shared Responsibility Statement: customer vs MDS duties, credentials, access, logging, backups, security incidents.
- Service Level Agreement and Support Policy: availability definition, exclusions, maintenance windows, credits (if offered), service tiers and response targets.
- Privacy and Data Retention Policy: operational telemetry, audit logs, build artifacts, retention and data subject requests.
- Third-Party Provider Disclosure: dependencies on Cloudflare, Vercel, Railway, infrastructure providers and portability.
- Billing, Metering, Fair Usage and Resource Limits: quotas, overages and suspension thresholds.
- Vulnerability Disclosure, DMCA/abuse intake, and domain/SSL policy as services expand.

**Governance metadata for MDS Trust Center policy drafts:** Policy Owner: Larry Simpson, SHRM-CP; Proposed Effective Date: May 1, 2026 (Pending Confirmation); Last Reviewed: November 1, 2026. These are requested metadata, not proof of legal approval or historical review. Do not publish as legally effective until approved.

**Legal caution:** The Cloudflare agreement includes restrictions on resale and third-party access absent permission. Verify actual upstream service terms and partner arrangements before selling or reselling dependent services. Obtain qualified legal review before release.
Source reference: https://www.cloudflare.com/terms/

## Decisions to make
1. VPS/container hosting region, isolation and provider.
2. Artifact store: R2 or S3-compatible.
3. Runner orchestration technology; dedicated isolated workers vs managed build service.
4. Billing model and SLA tiers.
5. Whether launch serves MDS-owned properties only (recommended first) or external customers.

## Definition of Done: Phase 1
Create/read projects, environments and provider targets; authorize deploy requests; enqueue jobs; log immutable changes; enforce tenant boundaries; show status and provider commit; no production DNS moves; GLASS receives test alerts.
