# CPSM Sandbox Environment

This branch introduces the first CPSM sandbox layer.

## Purpose

The sandbox is a safe testing environment for Client Portfolio Service Manager features before they are promoted to production. It should be used for mock clients, implementation workflows, document lifecycle testing, and future HCM/payroll integration experiments.

## Current sandbox page

Open:

```text
sandbox.html
```

The first version includes:

- Sandbox Command Center dashboard
- Mock client implementation projects
- Document workflow tracker
- Mock Paylocity-style Integration Lab
- Field mapping preview
- Data validation scorecards
- Activity/audit log
- Local sandbox reset control

## Data rules

Do not use real client data, real employee data, real payroll data, or real Paylocity credentials in the sandbox.

Use only mock records until CPSM has:

- Secure authentication
- Role-based access controls
- Encrypted credential storage
- API token handling
- Audit logs
- Environment-specific variables
- Approved production deployment controls

## Recommended environment structure

| Environment | Purpose | Suggested URL |
| --- | --- | --- |
| Local Development | Build in VS Code/local browser | `http://127.0.0.1:5500` |
| Sandbox/Staging | Live preview for testing | `sandbox.cpservicemanager.com` |
| Production | Stable client-ready app | `app.cpservicemanager.com` |

## Recommended branch structure

| Branch | Purpose |
| --- | --- |
| `main` | Production/source-of-truth |
| `staging` | Pre-production review branch |
| `development` | Shared development integration branch |
| `feature/*` | Isolated feature work |

## Next build phase

The next phase should convert the static sandbox into a stronger CPSM application foundation with:

1. Route-level sandbox detection
2. Environment configuration
3. Mock API service layer
4. JSON mock data files
5. Integration job history model
6. Document workflow model
7. User roles and permissions model
8. Future backend/API architecture plan

## Paylocity-style integration target

The sandbox Integration Lab is only a mock. It is designed to prepare CPSM for a future real integration by testing:

- Provider connection status
- Company/client mapping
- Employee import patterns
- Payroll setup field mapping
- Benefits/document workflow status
- Import/export activity logs
- Error handling patterns

Before using real Paylocity APIs, CPSM will need official API access, approved credentials, a secure backend, and a formal support process.
