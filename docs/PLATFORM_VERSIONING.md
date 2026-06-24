# CPSM Platform Versioning

## Current version

**Version 1.2 2026**

## Display requirement

The active platform version should appear near the bottom of CPSM side panels as:

```text
Version 1.2 2026
```

## Current implementation

The shared `script.js` file defines the current platform version in one location:

```js
const CPSM_PLATFORM_VERSION = 'Version 1.2 2026';
```

The script appends the version badge to supported CPSM side panels:

- Dashboard side panel
- Settings side panel
- CPSM portal side navigation
- Portal drawer side panel

## Future version management

Recommended next step:

1. Move version metadata into a dedicated configuration file.
2. Track release notes by version.
3. Add visible environment status when needed, such as Preview, Staging, or Production.
4. Require version updates for feature releases, schema changes, and client-visible workflow changes.

## Version 1.2 scope marker

Version 1.2 now includes the planning and initial UI shell for:

- Billable Hours internal model.
- Hours by Project client-facing view.
- Manual-entry flagging requirement.
- Admin recategorization, reclassification, revocation, approval, and release rules.
- Monthly release workflow feeding Financial Management and Invoices.
