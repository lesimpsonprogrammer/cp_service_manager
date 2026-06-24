# CPSM Build 1.2 — Locked Customer-Facing Review Build

## Build label

**CPSM Build 1.2**

## Repository

`lesimpsonprogrammer/cp_service_manager`

## Locked branch copy

`release/cpsm-build-1.2`

## Source branch

`feature/cpsm-settings-v1`

## Customer-facing direction

Build 1.2 is intended to preserve the current customer-facing CPSM direction for visual review and recovery.

This build includes:

- Vercel-inspired dashboard workspace.
- Persistent left-side dashboard navigation rail.
- Dashboard top rail link.
- Top-level module links for Project Management, Financial Management, Client Onboarding, Agreements, Client Directory, Staff Directory, Workflow Center, ETL Pipeline, API, and Notifications.
- Larger inline SVG-style side rail icons.
- Dashboard overview focused on the welcome heading, current status update, and key project metrics.
- Settings page using the same clean Vercel-inspired direction.
- Arial-only typography.
- Customer-facing navigation link colors: Dashboard, Settings, and Log out use matching neutral navigation styling.
- Approved Momentum Data logo asset restored after the rejected trial logo.

## Review pages

- `client-portal.html`
- `cpsm-settings.html`
- `project-management.html`
- `financial-management.html`
- `client-onboarding.html`
- `agreements.html`
- `client-directory.html`
- `staff-directory.html`
- `workflow-center.html`
- `etl-pipeline.html`
- `api-center.html`
- `notifications.html`

## Locked-build rule

Do not continue experimental visual changes directly on the locked copy. Future edits should continue from a feature branch, and a new locked build should be created only after visual review approval.

## Customer-facing standard

Every CPSM screen should be treated as a professional, client-facing software product screen. Avoid rough placeholder UI, mismatched navigation styling, oversized controls, inconsistent fonts, and unfinished-looking components.
