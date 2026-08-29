# Cloud Performance Service Manager — Platform

The data extraction / ETL / connector / webhook platform behind
`app.cpservicemanager.com`. Built with Next.js (App Router), Supabase
(Postgres + Auth), and deployed on Vercel.

The static marketing site at the repo root (`index.html`, `client-portal.html`,
etc.) is unaffected — this app lives entirely in `app/` and is a separate
deployment.

## What's here

- **Auth** — Supabase email/password auth. Every new signup gets its own
  organization (multi-tenant workspace) via a Postgres trigger.
- **Clients** — a CRM section for the companies each workspace runs data
  extraction, HR consulting, or managed payroll work for (`src/app/(dashboard)/clients`),
  organized into tabs per client:
  - **Overview** — contact info and status.
  - **Onboarding** — a stage tracker plus the contract e-signature workflow:
    approve a contract, send it for signature (emails a unique signing link
    via Resend), and an Actions menu to edit, manually override the status,
    purge (reset) the signing progress, or delete the contract.
  - **Contracts** — the full contract record list and a PDF for each
    (`src/lib/contracts/pdf.ts`, built with `pdf-lib`).
  - **Accounting** — billing contacts (client-side and Momentum-side) and
    payment terms/method.
  - **Compliance** — HIPAA and applicable-state-privacy-law flags
    (`src/lib/compliance/frameworks.ts`), shown to the team and printed on
    the contract PDF as a disclosure. These are flags for visibility, not an
    enforcement engine — verify actual obligations with counsel.
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
  with every run recorded in `pipeline_runs` (`src/lib/etl`).
- **Webhooks** — inbound receivers (external systems push data in, HMAC
  verified) and outbound subscriptions (get notified on `pipeline.run.completed`,
  etc.), both with a delivery log.
- **Public REST API** — `/api/v1/*`, authenticated with `Authorization: Bearer <api key>`.
  Keys are managed in-app and only ever shown once, in full, at creation time.

## Local setup

1. Create a Supabase project.
2. Run the migrations in `supabase/migrations/` against it, in order
   (`0001_init.sql` through `0004_contract_esignature.sql`) — via the
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

## Deploying

Deploy this `app/` directory to Vercel as its own project, pointed at
`app.cpservicemanager.com`. Set the same environment variables from
`.env.example` in the Vercel project settings (`NEXT_PUBLIC_APP_URL` should
be `https://app.cpservicemanager.com` in production).

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
