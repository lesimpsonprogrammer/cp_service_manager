# CPSM Baseline and Decision Log

This document is the source of truth for important CPSM project decisions, approved baselines, recovery points, and quality-control rules.

## Current Approved Baseline

**Baseline name:** CPSM Login Baseline v1

**Approved commit:** `5f52e254f2074ba0e9d653ecbe67ddfbf584b23f`

**Short commit reference:** `5f52e25`

**Backup branch:** `backup/cpsm-login-baseline-v1-standalone`

**Repository:** `lesimpsonprogrammer/cp_service_manager`

**Primary branch:** `main`

## Baseline Decision

The CPSM login page was restored to commit `5f52e25` after later versions introduced visual drift, including a blurry left-side image, oversized login text, missing welcome messaging, and a layout that no longer matched the intended direction.

This restored version is now the approved CPSM login baseline and should be protected as the recovery point before future changes are made.

## Approved Login Page Direction

The CPSM login page should maintain the following direction:

- Split-screen layout.
- Left-side visual area with a welcome message.
- Right-side login card.
- Professional, balanced typography.
- No blurry, stretched, or low-quality hero image.
- No oversized or clipped headings.
- Login form should remain clean, readable, and controlled.
- The visual quality of the page should improve over time, not decrease because of additional requests.

## External Design Reference

**Reference example:** `https://access.paylocity.com`

The Paylocity access page is being used only as a high-level reference for enterprise login behavior and structure. CPSM should not copy Paylocity branding, assets, wording, layout, or proprietary design. It may use the reference to guide professional login-page expectations, including:

- A clear welcome/login entry point.
- Company/client ID style access logic.
- Username and password fields.
- Remember username option.
- Login help or support access.
- Single sign-on as a future option.
- Register/new user flow as a future option.
- Privacy/support links.
- Clean, simple, enterprise-style presentation.

CPSM should remain visually distinct and aligned to Momentum Data / Client Portfolio Service Manager branding.

## Protected Rules

1. Do not redesign, overwrite, or substantially alter the CPSM login page without explicit approval.
2. Do not layer broad changes into the login page while also adding unrelated features.
3. Do not treat a change as complete until the page has passed visual QA.
4. Before major visual edits, compare the change against this baseline.
5. If the site drifts again, return to the backup branch or approved commit before making new edits.
6. Preserve this document as the source of truth for CPSM baseline decisions.
7. Use external examples as inspiration only; do not copy another company's branding, proprietary layout, logo, or visual identity.

## Quality-Control Rules

For future CPSM work:

- Make one controlled change at a time.
- Review the affected page visually before saving/pushing.
- Check for image clarity, text scale, spacing, alignment, and layout balance.
- Confirm that approved design elements were not accidentally removed.
- Avoid introducing new features before stabilizing existing approved pages.
- Update this document when a new baseline, major decision, or recovery point is approved.

## Current Recovery Point

If recovery is needed, use:

```bash
git switch main
git fetch origin
git reset --hard 5f52e254f2074ba0e9d653ecbe67ddfbf584b23f
```

or restore from the backup branch:

```bash
git switch backup/cpsm-login-baseline-v1-standalone
```

Only force-push after confirming that the restored version is the intended version.

## Decision: CPSM Platform Architecture (Approved Direction, 2026-10-24)

CPSM becomes three parts that share one system of record:

```
CPSM (customer-facing)      CPSM (internal only)
          \                      /
           \                    /
     Database Management Platform  (separate domain)
     one system of record for all entities, on Supabase
```

| Part | Who uses it | Grows out of | Holds database credentials |
|---|---|---|---|
| **CPSM — internal** | Momentum staff only | today's staff dashboard (`app/src/app/(dashboard)`) | No |
| **CPSM — customer-facing** | Clients only | today's client portal (`app/src/app/client`) | No |
| **Database Management Platform** | Momentum admins (screens) + both CPSM apps (API) | new | **Yes — the only part that does** |

### Rules

1. **One system of record.** Every entity (clients, contacts, contracts, invoices, tickets, projects, etc.) is defined once, in the Database Management Platform. Neither CPSM app keeps its own copy, so there is nothing to sync.
2. **Only the platform touches the database.** The Supabase service-role key and database URL live on the platform's deployment only. The CPSM apps read and write through the platform's versioned API.
3. **The platform decides access.** Each CPSM app calls the API with its own app key plus the signed-in person's Supabase access token. The platform resolves who that person is server-side and never trusts an org or client ID sent in the request. A customer request is always scoped to that customer's own client.
4. **Login stays Supabase Auth**, one shared user pool. Staff are `org_members` and customers are `client_portal_users`; the two are already mutually exclusive.
5. **Stay on Supabase for now.** Moving off Supabase is a separate, later decision. Migrations stay manual (see `CLAUDE.md`).
6. **The platform is on a separate domain.** Its name and address are not decided yet, so no domain is hard-coded: every app reads the others' addresses from environment variables.
7. **The protected login rules above apply to both CPSM login pages** once they are separate apps.

### Phases (one controlled change at a time)

0. **Record the decision.** (This entry.)
1. **Scaffold the platform** in a new top-level `dmp/` folder, alongside `app/` and `decision-engine/`. Nothing in `app/` changes. It gets an entity registry (which tables and columns each entity exposes), a versioned API (`/api/v1/entities/...`) with app-key + user-token auth, and read endpoints for a first entity. It also gets its own Vercel project.
2. **Move CPSM onto the API, one entity at a time.** Start with the client portal's Service Desk writes, which use the service-role key today, so the customer-facing side loses database access first.
3. **Platform screens:** entity browser, access rules, and an audit log. The existing SQL Editor and Data Studio are database-management tools and are candidates to move here.
4. **Split CPSM** into its internal and customer-facing deployments. Neither gets database keys.
5. **Optional, later:** leave Supabase. Because all access goes through the platform, this becomes a change to one app instead of three.

### Still open

- Platform name and domain.
- Customer-facing CPSM name and domain.
- Whether the SQL Editor and Data Studio move to the platform (Phase 3).

## Going Forward

This document must be updated whenever we make or approve major decisions related to:

- CPSM visual baselines.
- Page recovery points.
- GitHub branches or protected backup versions.
- Vercel/local deployment differences.
- Approved design direction.
- Quality-control rules.
- External design references and inspiration sources.
- Major feature additions that affect the app structure.

Last updated: 2026-10-24
