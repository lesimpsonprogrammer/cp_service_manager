# Continuous Improvement Log

Tracks incremental fixes and open opportunities across both properties in
this repo, using a plain plan → do → check → act loop:

- **Plan** — something is found (a bug, friction point, piece of tech debt,
  or a metric worth improving).
- **Do** — a small, scoped change is made for it.
- **Check** — it's verified (typecheck/lint/manual test, noted below).
- **Act** — closed out here, or, if it revealed a bigger pattern, becomes a
  new Plan entry.

Two sites tracked separately:

- **App** — `app/` — the Next.js/Supabase product at app.momentumdatasolutions.com
- **Marketing** — repo root — the static site at momentumdatasolutions.com

Newest entries at the top of each table. Status is one of: `Open`,
`In progress`, `Done`.

## App

| Date       | Issue                                                                                          | Root cause                                                                 | Fix                                                                                          | Status |
|------------|--------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|--------|
| 2026-09-08 | Only one org per user was ever visible or reachable; the app silently locked users into whichever org membership was oldest | `getCurrentOrg()` had multi-org switching explicitly scaffolded but never built (per its own code comment) | Added `active_org_id` cookie + `switchActiveOrg` server action (re-verifies membership) + `OrgSwitcher` dropdown in the topbar and SQL Editor | Done |
| 2026-09-08 | "New workflow" form's Name/Stages fields looked pre-filled (placeholder text) but were actually empty, so Create workflow failed required-field validation | Placeholder-only fields with no real defaults, visually similar to filled text | Added a "Start from a preset" dropdown that fills real values into all three fields (Custom option for free typing) | Done |
| 2026-09-08 | Client portal had no per-person access control — every invited client contact saw every screen (Projects, Data, Contracts, Invoices) | No role concept on `client_portal_users`, only a binary invited/not-invited | Added `client_portal_role` (Client User / Client Administrator / Client TPA), gated in both the sidebar nav and per-page server redirects | Done |
| 2026-09-08 | Client portal login (`/client/login`) had no way to recover a forgotten or expired password | Staff login has a full forgot-password flow (`resetPasswordForEmail`); the client portal never got the equivalent route | Not yet built — flagged, workaround is Supabase Dashboard → Auth → Users → Send password reset | Open |

## Marketing

| Date | Issue | Root cause | Fix | Status |
|------|-------|------------|-----|--------|
| —    | —     | —          | —   | —      |

## How this gets used going forward

Whenever we're working in this repo, worth logging here as it comes up:
things fixed along the way (like the placeholder-field bug above, found
incidentally while doing something else), and open items worth coming back
to. This file doesn't run itself — I'll keep it current during sessions
here; if you want a standing recurring pass (e.g. a weekly sweep of both
sites for opportunities) that fires on its own without you prompting it,
that's a `/loop` job I can set up separately.
