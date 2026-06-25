# Momentum Data Client Edition of CPSM

## Decision

Momentum Data will need an appropriate client-facing version of CPSM for its own clients.

This should not mean that CPSM becomes only a Momentum Data portal. Instead, CPSM should support two related views:

1. **CPSM Core Product** — the standalone platform identity and reusable product foundation.
2. **Momentum Data Client Edition** — a tenant-branded or company-branded client workspace used by Momentum Data clients.

## Why this matters

The product foundation should remain CPSM-first, while Momentum Data should be able to use CPSM as its client service delivery workspace.

This gives Momentum Data a practical operating version of the software without confusing the product identity.

## CPSM Core Product

The CPSM core product should own the reusable platform model:

- Dashboard
- Clients
- Projects
- Services
- Workflows
- Document Library
- Billable Hours
- Implementation Tracker
- Integration Lab
- Reports
- Admin Settings
- Roles and permissions
- Environment and sandbox controls

## Momentum Data Client Edition

The Momentum Data client-facing edition should be configured for Momentum Data service delivery.

It may include Momentum Data branding in the appropriate places, but the product should still be understood as CPSM-powered.

Suggested positioning:

**Powered by CPSM for Momentum Data client delivery.**

## MD client edition modules

The MD client edition should focus on the modules Momentum Data clients actually need to interact with:

1. Client Dashboard
2. Project Status
3. Document Library
4. Required Uploads
5. Workflow Requests
6. Messages / PM Notes
7. Deliverables
8. Agreements and Engagement Documents
9. Billable Activity Summary
10. Implementation / Data Readiness Tracker

## Branding rule

Use this rule:

- CPSM is the product platform.
- Momentum Data is the service provider / tenant / operator.
- Momentum Data clients may see Momentum Data branding, but the software architecture should not hard-code CPSM as only Momentum Data.

## Navigation difference

### CPSM Core Product Navigation

- Dashboard
- Clients
- Projects
- Services
- Workflows
- Document Library
- Billable Hours
- Implementation Tracker
- Integration Lab
- Reports
- Admin Settings

### Momentum Data Client Edition Navigation

- Dashboard
- My Project
- Required Documents
- Upload Center
- Deliverables
- Messages
- Agreements
- Status Updates
- Billable Summary
- Support

## Role difference

### Internal Momentum Data users

Internal users should see the full service delivery workspace:

- Client portfolio
- Project management
- Document management
- Workflow management
- Billable hours
- Reports
- Admin settings

### Momentum Data client users

Client users should see only their assigned client workspace:

- Their project status
- Their required uploads
- Their shared deliverables
- Their agreements
- Their messages
- Their open requests
- Their visible billable summary if enabled

## Technical direction

The long-term structure should support tenant-aware configuration:

- Tenant name
- Tenant logo
- Tenant color theme
- Client-specific access rules
- Enabled modules by tenant
- Enabled modules by role
- White-label or co-branded mode

## Immediate build implication

The recovery branch should preserve the Build 1.2 dashboard direction, but future work should split the app into:

1. A CPSM product/platform shell.
2. A Momentum Data client-facing configuration.
3. A sandbox/testing environment.

This prevents the same confusion from happening again.
