# Billable Hours (Internal Model) and Hours by Project

## Platform version

Target platform version: **Version 1.2 2026**

This feature introduces an internal billable-hours capture model for project managers and administrators, with a separate client-facing **Hours by Project** view that only becomes visible after internal approval and release.

## Feature names

- **Billable Hours**: Internal model used by Momentum Data / CPSM administrators, project managers, and approved internal users.
- **Hours by Project**: Client-facing summary view that shows approved and released total hours by project.

## Primary goals

1. Allow project managers to clock and track all hours for the week.
2. Allow manual hour entry when needed.
3. Flag manual entries in reporting.
4. Allow an admin review layer for recategorization, reclassification, revocation, approval, and release control.
5. Keep client-facing hours hidden until the internal Billable Hours process is approved and released.
6. Connect approved hours to Financial Management, then to Invoices.

## Internal user flow

1. Client profile is created during onboarding.
2. When the client is close to onboarding completion, the client profile can be released to Billable Hours.
3. Project manager tracks time using a timer or manual entry.
4. Weekly timecards are submitted for approval.
5. Admin reviews timecards and can:
   - Approve hours.
   - Revoke hours.
   - Recategorize hours.
   - Reclassify hours.
   - Flag or review manual entries.
6. Approved hours can be prepared for release seven days prior to month end.
7. Released totals become available in Hours by Project.
8. Hours by Project passes approved totals to Financial Management.
9. Financial Management passes invoice-ready records to Invoices.

## Client visibility rule

Hours by Project must not be fully visible to the client until the total hours are approved and released from Billable Hours.

Client-facing visibility states:

| State | Client visibility |
| --- | --- |
| Draft | Hidden |
| Submitted | Hidden |
| Admin review | Hidden |
| Approved | Hidden until release |
| Released to Hours by Project | Visible as approved totals |
| Sent to Financial Management | Visible as applicable summary only |
| Invoice generated | Visible through invoice workflow |

## Billable Hours data model draft

Suggested fields for a future database table:

| Field | Purpose |
| --- | --- |
| `time_entry_id` | Unique time entry identifier |
| `client_id` | Client/company relationship |
| `project_id` | Project being worked |
| `user_id` | Person entering or clocking time |
| `role` | Project Manager, Admin, Consultant, etc. |
| `work_date` | Date work occurred |
| `week_start_date` | Weekly timecard grouping |
| `start_time` | Timer start timestamp |
| `end_time` | Timer stop timestamp |
| `duration_hours` | Calculated or manually entered hours |
| `entry_source` | Timer or Manual |
| `manual_entry_reason` | Required when manual |
| `manual_entry_flag` | True when manual entry is used |
| `work_category` | Category before admin review |
| `approved_category` | Category after recategorization/reclassification |
| `status` | Draft, Submitted, Approved, Revoked, Released |
| `admin_reviewer_id` | Admin who reviewed the entry |
| `review_notes` | Internal comments |
| `released_to_client_at` | Release timestamp for Hours by Project |
| `released_to_finance_at` | Timestamp for Financial Management handoff |
| `invoice_reference` | Invoice relationship when created |

## Admin controls

Admin functions should include:

- Recategorize hours.
- Reclassify hours.
- Revoke hours.
- Approve timecards.
- Hold timecards.
- Release approved totals to Hours by Project.
- Flag manual entries in reports.
- Lock entries after release unless reopened by an authorized admin.

## Timer function requirements

Timer functionality should include:

- Start timer.
- Pause timer.
- Resume timer.
- Stop timer.
- Assign timer to client and project.
- Assign timer to category.
- Save timer output as billable hours.
- Prevent client visibility until approval and release.

## Manual entry reporting rule

Manual entries are allowed, but every report must flag them.

Minimum reporting indicators:

- Entry source: Timer or Manual.
- Manual entry reason.
- Created by.
- Approved by.
- Modified by.
- Recategorized or reclassified status.

## Monthly release rule

Seven days prior to the end of the month, approved timecards can be reviewed for release to Hours by Project.

The release should be optional and controlled by authorized users. Approved hours should not automatically appear to the client until release is confirmed.

## Integration map

```text
Client Onboarding
  -> Billable Hours
  -> Approved Timecards
  -> Hours by Project
  -> Financial Management
  -> Invoices
```

## Version management

The platform should display the active version in the lower portion of the side panel:

```text
Version 1.2 2026
```

This branch adds the initial version badge to side panels through shared CPSM JavaScript so the version can be managed from one location.
