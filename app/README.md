# Cloud Performance Service Manager — Platform

The data extraction / ETL / connector / webhook platform behind
`app.momentumdatasolutions.com`. Built with Next.js (App Router), Supabase
(Postgres + Auth), and deployed on Vercel.

The static marketing site at the repo root (`index.html`, `client-portal.html`,
etc.) is unaffected — this app lives entirely in `app/` and is a separate
deployment.

## What's here

- **Auth** — Supabase email/password auth, locked down (`0011_signup_approval.sql`):
  a self-serve signup (work email only — free providers like Gmail/Yahoo are
  rejected, `src/lib/utils/email.ts`) no longer gets its own organization for
  free. It lands in `signup_requests` (pending) until an owner/admin approves
  it into an existing workspace with a chosen role, or rejects it
  (Settings → Pending signup requests). A pending/rejected user who confirms
  their email sees `/pending-approval` instead of the dashboard. Owners/admins
  can also send direct invite links (Settings → Invite people, `org_invites`)
  that join their org immediately, skipping the approval queue.
- **Docs** — an internal wiki (`src/app/(dashboard)/docs`), GitHub-docs-style:
  a category-grouped sidebar (`src/components/docs/DocsSidebar.tsx`, with a
  quick filter) alongside every doc, each written in Markdown with GitHub
  Flavored Markdown tables and `> [!NOTE]`/`[!TIP]`/`[!IMPORTANT]`/
  `[!WARNING]`/`[!CAUTION]` alert callouts (`src/lib/docs/markdown.ts`).
  Categories are a managed list per org (Settings → Doc categories,
  `doc_categories` table) rather than free text — the doc form is a dropdown
  over that list.
- **Clients** — a CRM section for the companies each workspace runs data
  extraction, HR consulting, or managed payroll work for (`src/app/(dashboard)/clients`),
  organized into tabs per client:
  - **Overview** — contact info and status.
  - **Onboarding** — a stage tracker plus the contract e-signature workflow:
    approve a contract, send it for signature (emails a unique signing link
    via Resend), and an Actions menu to edit, manually override the status,
    purge (reset) the signing progress, or delete the contract.
  - **Contracts** — the full contract record list and a PDF for each
    (`src/lib/contracts/pdf.ts`, built with `pdf-lib`). New contracts can
    start from a saved **Agreement Template** (its own top-level section,
    `src/app/(dashboard)/templates`) — reusable text with `{{client_name}}`,
    `{{org_name}}`, `{{contract_name}}`, `{{start_date}}`, `{{end_date}}`,
    and `{{value}}` placeholders, resolved at PDF/signing-page render time
    (`src/lib/contracts/template.ts`) so it's always correct even if those
    fields are filled in after the template is applied.
  - **Accounting** — billing contacts (client-side and Momentum-side) and
    payment terms/method.
  - **Compliance** — HIPAA and applicable-state-privacy-law flags
    (`src/lib/compliance/frameworks.ts`), shown to the team and printed on
    the contract PDF as a disclosure. These are flags for visibility, not an
    enforcement engine — verify actual obligations with counsel.
  - **Invoices** — itemized bills issued to the client, either created
    manually (`src/components/invoices/InvoiceForm.tsx`, dynamic line items)
    or generated from an approved timecard's billable hours in one click.
    Tracked through `draft -> sent -> paid`/`overdue`/`void`
    (`src/app/(dashboard)/invoices/actions.ts`), each with a PDF
    (`src/lib/invoices/pdf.ts`, built with `pdf-lib`, same pattern as
    contracts) and a "Send to client" action that emails the billing
    contact via Resend with a link to the PDF. A cross-client `/invoices`
    view lists every invoice in the workspace with outstanding/paid totals.
  - **Data Sources** — data sources linked to that client.

  The e-signature itself (`/sign/[token]`, public, no login) is a
  lightweight in-house flow — typed name + checkbox, timestamped with IP —
  not a certified provider like DocuSign. A daily Vercel Cron job
  (`vercel.json` → `/api/cron/contract-reminders`) emails a reminder for any
  contract that's been sitting unsigned for a few days; the same email can
  also be triggered manually from the Onboarding tab.
- **Connectors** — a small plugin architecture (`src/lib/connectors`) with
  working adapters for CSV/paste, public Google Sheets, generic REST APIs,
  and PostgreSQL. HCM and ERP systems (BambooHR, Workday, ADP, NetSuite, SAP,
  etc.) onboard as REST APIs configured with a vendor base URL/token.
- **ETL pipelines** — extract → field-mapping → transform steps → load,
  with every run recorded in `pipeline_runs` (`src/lib/etl`). A pipeline with
  no destination runs in preview mode: it extracts and transforms but loads
  nowhere, and a sample of the transformed output is stored on the run for
  review. "Promote to live" sets a destination and re-runs for real; a live
  load can be undone from the run history for destinations whose adapter
  implements `unload` (Postgres today), which deletes matching rows
  best-effort from the destination.
- **Webhooks** — inbound receivers (external systems push data in, HMAC
  verified) and outbound subscriptions (get notified on `pipeline.run.completed`,
  etc.), both with a delivery log.
- **Public REST API** — `/api/v1/*`, authenticated with `Authorization: Bearer <api key>`.
  Keys are managed in-app and only ever shown once, in full, at creation time.

## Local setup

1. Create a Supabase project.
2. Run the migrations in `supabase/migrations/` against it, in order
   (`0001_init.sql` through `0013_doc_categories.sql`) — via the
   Supabase SQL editor, or `supabase db push` if you're using the CLI.
3. Copy `.env.example` to `.env.local` and fill in your project's URL and
   keys (Project Settings → API), plus a [Resend](https://resend.com) API
   key and verified sending domain if you want signing/reminder emails to
   actually send (without it, the app logs a warning and skips sending).
4. `npm install`
5. `npm run dev`

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint (flat config, `eslint-config-next`)
- `npm run test` — unit tests (Vitest) for pure logic: connector adapters
  (including a mocked-`fetch` suite for the TaxBandits OAuth + UserToken
  flow), webhook HMAC signing, and contract template rendering
  (`tests/unit/`)
- `npm run test:e2e` — Playwright smoke tests (`tests/e2e/`) that boot the
  dev server against placeholder Supabase env vars and check the public
  pages render and protected routes redirect signed-out visitors to
  `/login`. Requires Chromium; if `playwright install` can't reach the
  network, point `PLAYWRIGHT_CHROMIUM_EXECUTABLE` at an existing Chromium
  binary instead.

Both suites run in CI on every PR via `.github/workflows/test.yml`.

## Deploying

Deploy this `app/` directory to Vercel as its own project, pointed at
`app.momentumdatasolutions.com`. Set the same environment variables from
`.env.example` in the Vercel project settings (`NEXT_PUBLIC_APP_URL` should
be `https://app.momentumdatasolutions.com` in production).

For scheduled pipelines, add a Vercel Cron job that calls
`POST /api/v1/pipelines/{id}/run` with an API key on the cron expression
stored on the pipeline.

`vercel.json` already defines the daily contract-reminder cron. Set
`CRON_SECRET` in the Vercel project's environment variables (any random
string, e.g. `openssl rand -hex 32`) — Vercel automatically sends it as
`Authorization: Bearer <value>` when it triggers the cron, which the route
checks.

## Secrets

This scaffold stores connector credentials (API keys, database passwords)
directly in `data_sources.config` (jsonb), masked in the UI but not
encrypted at rest beyond Postgres's own storage. Before handling real
customer credentials in production, move secret fields into
[Supabase Vault](https://supabase.com/docs/guides/database/vault) or an
external secrets manager, and store only a `secret_ref` pointer in
`data_sources` (the column already exists for this). The connector field
definitions in `src/lib/connectors/registry.ts` already flag which fields
are secrets (`secret: true`).

## Extending connectors

Add a new connector type in three steps:

1. Add the type to `DataSourceType` in `src/types/database.ts` and the
   `data_source_type` Postgres enum (new migration).
2. Describe its config form in `src/lib/connectors/registry.ts`.
3. Implement `ConnectorAdapter` (`testConnection`, `extract`, optionally
   `load`) in `src/lib/connectors/adapters/`, and register it in
   `src/lib/connectors/index.ts`.

## Database types

`src/types/database.ts` is hand-written to mirror the SQL migration. Once
the Supabase project is linked via the CLI, regenerate it with:

```
supabase gen types typescript --linked > src/types/database.ts
```
