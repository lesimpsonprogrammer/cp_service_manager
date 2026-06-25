# CPSM Foundation Build Roadmap

## Current branch

`feature/cpsm-product-foundation`

## Purpose of this branch

This branch resets CPSM around its correct identity as a standalone product platform.

It does not replace the production website yet. It provides a corrected product direction, preview page, and roadmap before any merge into `main`.

## Files added

| File | Purpose |
| --- | --- |
| `docs/cpsm-product-foundation.md` | Source-of-truth product reset plan |
| `docs/cpsm-build-roadmap.md` | Build sequence and next steps |
| `cpsm-platform.html` | Static preview of the corrected CPSM product platform |
| `cpsm-platform.css` | Styling for the CPSM product platform preview |

## What changed conceptually

CPSM is no longer being treated as only a Momentum Data client portal.

CPSM is now framed as:

- A client portfolio service management platform
- An implementation operations command center
- A workflow and document management system
- A billable hours and project time entry system
- A future integration hub for HCM/payroll/ERP/service data

## Phase 1: Product foundation

Status: Started

Goals:

1. Establish standalone CPSM identity.
2. Define product modules.
3. Define roles and access model.
4. Add corrected product preview page.
5. Keep this isolated from `main` until reviewed.

## Phase 2: Correct app navigation

Goals:

1. Replace portal-first navigation with product module navigation.
2. Add sidebar-first application structure.
3. Separate public marketing pages from protected app pages.
4. Make Document Library, Billable Hours, Workflows, and Implementation Tracker first-class modules.

## Phase 3: Sandbox rebuild

Goals:

1. Rebuild sandbox from the corrected CPSM product foundation.
2. Keep mock data only.
3. Add mock clients, projects, workflows, documents, and integration activity.
4. Prepare `sandbox.cpservicemanager.com` as the future preview environment.

## Phase 4: True app architecture

Goals:

1. Decide whether to migrate CPSM into Next.js now or after more static product prototyping.
2. Add routing, reusable components, and protected layouts.
3. Add backend/data model planning.
4. Add role-based dashboards.

## Phase 5: MVP build

Recommended MVP modules:

1. Dashboard
2. Clients
3. Projects
4. Workflows In Progress
5. Document Library
6. Billable Hours / Project Time Entry
7. Implementation Tracker
8. Admin Settings

## Do not merge yet

Do not merge this branch into `main` until:

- The product identity is approved.
- The sidebar module structure is approved.
- The preview page is reviewed.
- We decide whether static prototype or Next.js app foundation is the next move.
