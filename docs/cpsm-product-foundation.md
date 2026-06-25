# CPSM Product Foundation Reset

## Why this reset exists

CPSM was drifting into a Momentum Data client portal. That is not the correct long-term product direction.

CPSM should be treated as its own software product:

**CPSM — Client Portfolio Service Manager**

CPSM is an implementation operations and client portfolio management platform for managing clients, projects, services, documents, workflows, billable hours, implementation readiness, and future integration activity.

Momentum Data may own, operate, or use CPSM, but CPSM should not be designed as only a Momentum Data website/client login page.

---

## Product identity

### Product name

Client Portfolio Service Manager

### Product acronym

CPSM

### Product positioning

CPSM helps teams manage client service delivery, implementation projects, workflow status, document readiness, billable activity, and system handoffs from one structured command center.

### Product category

Implementation operations platform / client portfolio service management suite.

### Not this

- Not only a static website
- Not only a client login page
- Not only a Momentum Data portal
- Not only a document repository
- Not only a project tracker

### This instead

A product platform with role-based dashboards, client/project records, implementation workflows, document management, billable hours, reporting, and future HCM/payroll integration support.

---

## Core modules

1. Dashboard
2. Clients
3. Projects
4. Services
5. Workflows
6. Document Library
7. Billable Hours
8. Implementation Tracker
9. Integration Lab
10. Reports
11. Admin Settings

---

## Roles

| Role | Purpose |
| --- | --- |
| Super Admin | Full platform control and configuration |
| Engineering Admin | Technical setup, integrations, environments, audit support |
| Internal Consultant | Client service delivery and task execution |
| Project Manager | Owns project status, milestones, workflows, and billable activity |
| Client User | Uploads documents, reviews requests, tracks assigned work |
| Viewer/Auditor | Read-only project, document, and audit visibility |

---

## Approved functional direction from prior decisions

### Document Library

The Document Library should be a standalone module accessible from the sidebar. The page should include an uploader and a management table with category assignment, document type, expiration date, status, visibility, notes, and related client/project/service fields.

Client users should only upload and view documents tied to their own client account. Internal users should upload and manage documents for any client.

Accepted file types include PDF, Google Docs/Sheets, Word documents, and Excel files.

### Billable Hours / Timecards

Manual timecard entries should live inside the Billable Hours module. The first view inside Billable Hours should be Project Time Entry.

The separate Manual Entry button should be removed.

CPSM should track average task completion time over historical manual timecard/task entries and use those averages to improve future estimated billable hours.

### Workflows In Progress

The dashboard should include a Workflows In Progress section showing workflow names grouped or listed by trigger.

### Integration direction

The Integration Lab should initially use mock data and mock provider connectors. Future provider support may include Paylocity, ADP, Paycor, Paychex, UKG, Workday, and other HCM/payroll systems.

---

## Environment strategy

| Environment | Purpose | Suggested URL |
| --- | --- | --- |
| Local Development | Build in VS Code/local browser | `http://127.0.0.1:5500` or framework dev server |
| Sandbox/Staging | Safe testing with mock data | `sandbox.cpservicemanager.com` |
| Production | Stable client-ready app | `app.cpservicemanager.com` |

---

## Branch strategy

| Branch | Purpose |
| --- | --- |
| `main` | Production/source-of-truth branch |
| `feature/cpsm-product-foundation` | Current product reset foundation branch |
| `feature/*` | Isolated feature work |
| `staging` | Future pre-production review branch |
| `development` | Future shared integration branch |

---

## Immediate build priorities

1. Reframe CPSM navigation around the product modules.
2. Create a corrected CPSM platform preview.
3. Stop using Momentum Data as the main app identity.
4. Keep Momentum Data as company/owner context only when needed.
5. Create a dedicated sandbox product environment after the foundation is corrected.
6. Move toward a true app architecture when ready.

---

## Future technical foundation

CPSM will eventually need:

- Authentication
- Role-based permissions
- Database schema
- API service layer
- Environment variables
- Protected routes
- Audit logs
- File/document storage
- Workflow engine
- Integration job history
- Secure credential storage
- Deployment controls

The current static files are useful for visual and product-direction prototypes, but CPSM should eventually move into a proper application architecture.
