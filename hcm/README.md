# PeopleOps Cloud HCM

A runnable MVP scaffold for a Human Capital Management platform covering:

- Core HR employee system of record
- Payroll preview, approval, and payroll-to-GL journal creation
- Benefits administration configuration
- Recruiting requisitions and candidate tracking
- Talent and performance review tracking
- Expense report approvals
- Onboarding and offboarding workflow automation
- IT asset assignment and recovery tracking
- Accounting journals and exports foundation
- Tenant configuration, role-aware access, and audit logs

This version is intentionally dependency-free so you can open it in VS Code and test it quickly with Node.js only.

## Requirements

- Node.js 18 or newer
- VS Code

No `npm install` is required for this MVP because it only uses built-in Node.js modules.

## Start locally

```bash
cd peopleops-cloud-hcm
node server.js
```

Open:

```text
http://localhost:3000
```

Demo login:

```text
Email: admin@acme.test
Password: demo123
```

Other demo users:

```text
hr@acme.test / demo123
manager@acme.test / demo123
```

## Test in VS Code

1. Unzip the project.
2. Open the folder in VS Code.
3. Press `Ctrl + Shift + P` or `Cmd + Shift + P`.
4. Choose **Tasks: Run Task**.
5. Select **Start HCM app**.
6. Visit `http://localhost:3000`.

You can also use the VS Code debugger:

1. Open the **Run and Debug** panel.
2. Choose **Run PeopleOps Cloud HCM**.
3. Press the play button.

## Reset demo data

```bash
node scripts/reset-data.js
```

This restores `data/db.local.json` from `data/seed.json`.

## Run smoke test

```bash
npm run test:smoke
```

The smoke test starts the server on port `3100`, logs in, loads the dashboard, creates an onboarding workflow, and previews payroll.

## Main API endpoints

### Auth

```text
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

### Dashboard

```text
GET /api/dashboard
```

### Generic CRUD collections

```text
GET    /api/employees
POST   /api/employees
GET    /api/employees/:id
PUT    /api/employees/:id
DELETE /api/employees/:id
```

The same pattern applies to:

```text
requisitions
candidates
benefitPlans
enrollments
payrollRuns
expenseReports
performanceReviews
assets
journals
tasks
auditLogs
```

### Workflows

```text
POST /api/workflows/onboard
POST /api/workflows/offboard
```

### Payroll actions

```text
POST /api/payrollRuns/:id/preview
POST /api/payrollRuns/:id/approve
```

Payroll approval automatically creates an accounting journal.

### Expense actions

```text
POST /api/expenseReports/:id/manager-approve
POST /api/expenseReports/:id/finance-approve
POST /api/expenseReports/:id/reject
POST /api/expenseReports/:id/mark-paid
```

## Data model

The local database is stored at:

```text
data/db.local.json
```

The seed database is stored at:

```text
data/seed.json
```

For a production version, replace the JSON file store with PostgreSQL and add migrations.

## Production hardening checklist

Before using this with real employee data, add:

- Real authentication with SSO/OIDC/SAML
- Password hashing and account lockout
- Database-backed sessions or JWTs with refresh token rotation
- PostgreSQL or another production database
- Field-level encryption for SSN, bank, tax, and benefits data
- Object storage for documents
- Secure document e-signature workflow
- Payroll tax engine or payroll provider integration
- Benefits carrier file generation and SFTP controls
- SCIM/SSO integrations for IT provisioning
- SOC 2-ready logging, monitoring, and change management
- Automated tests for payroll, benefits eligibility, permissions, and workflows

## Folder structure

```text
peopleops-cloud-hcm/
├── server.js                 # API server and static app host
├── public/
│   ├── index.html            # Web app shell
│   ├── app.js                # Frontend logic
│   └── styles.css            # UI styling
├── data/
│   └── seed.json             # Demo tenant and records
├── scripts/
│   ├── reset-data.js         # Reset local DB
│   └── smoke-test.js         # End-to-end smoke test
├── docs/
│   ├── API.md
│   └── ROADMAP.md
└── .vscode/
    ├── launch.json
    └── tasks.json
```
