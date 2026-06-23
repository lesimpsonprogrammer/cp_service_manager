# CPSM Baseline and Decision Log

This document is the source of truth for important CPSM project decisions, approved baselines, recovery points, and quality-control rules.

## Current Approved Baseline

**Baseline name:** CPSM Login Baseline v1

**Approved commit:** `5f52e254f2074ba0e9d653ecbe67ddfbf584b23f`

**Short commit reference:** `5f52e25`

**Backup branch:** `backup/cpsm-login-baseline-v1-standalone`

**Repository:** `lesimpsonprogrammer/cp_service_manager`

**Primary branch:** `main`

## Active Work Branches

### Login form branch

**Branch:** `feature/cpsm-form-v1`

**Purpose:** Controlled login form experience updates from the approved baseline.

### Settings branch

**Branch:** `feature/cpsm-settings-v1`

**Purpose:** Build the CPSM Settings v1 shell separately from the login form work and protected baseline.

**Settings v1 scope:**

- General app and organization settings.
- Client workspace setup.
- Users and roles.
- Access options.
- Agreements and acknowledgments.
- Project defaults.
- Notifications.
- Integrations roadmap.
- Audit log preview.

The settings shell currently saves preview values in browser storage only. A future version should connect settings to a backend database.

## Active Change Notes

### 2026-06-23 — Settings v1 shell expansion

Controlled adjustment completed on `feature/cpsm-settings-v1`:

- Expanded `cpsm-settings.html` into a full settings shell.
- Refined `cpsm-settings.css` for settings panels, sidebar navigation, integration cards, audit cards, textarea fields, and responsive behavior.
- Updated `cpsm-settings.js` so preview settings can be saved and reset locally.
- Kept settings work separate from the protected login baseline and the login form branch.

This settings page should be visually reviewed before it is merged into `main`.

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
8. Keep settings work isolated from login baseline work unless a merge is explicitly approved.

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

Last updated: 2026-06-23
