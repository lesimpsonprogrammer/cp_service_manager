# Billable Hours (Internal Model) and Hours by Project

## Platform version

Target platform version: **Version 1.2 2026**

This feature introduces an internal billable-hours capture model for project managers and administrators, with a separate client-facing **Hours by Project** view that only becomes visible after internal approval and release.

## Feature names

- **Billable Hours**: Internal model used by Momentum Data / CPSM administrators, project managers, and approved internal users.
- **Project Time Entry**: Default Billable Hours view where project managers manually enter or review timecard activity by Project ID.
- **Hours by Project**: Client-facing summary view that shows approved and released total hours by project.

## Primary goals

1. Allow project managers to clock and track all hours for the week.
2. Allow direct project time entry when needed.
3. Remove the inactive **Manual Entry** button and make Project Time Entry the first Billable Hours experience.
4. Flag manual/direct entries in reporting.
5. Track the average time required to complete recurring tasks and deliverables.
6. Bake historical average completion time into future billable-hour estimates.
7. Allow an admin review layer for recategorization, reclassification, revocation, approval, and release control.
8. Keep client-facing hours hidden until the internal Billable Hours process is approved and released.
9. Connect approved hours to Financial Management, then to Invoices.

## Internal user flow

1. Client profile is created during onboarding.
2. When the client is close to onboarding completion, the client profile can be released to Billable Hours.
3. Project manager opens **Billable Hours** and lands directly on **Project Time Entry**.
4. Project manager searches or enters the Project ID.
5. CPSM auto-populates client name and project description when available.
6. Project manager selects the task or deliverable being completed.
7. CPSM displays the historical average time, suggested estimate, estimated week-to-date hours, actual week-to-date hours, and variance.
8. Project manager logs time in/time out or saves a draft timecard entry.
9. Weekly timecards are submitted for approval.
10. Admin reviews timecards and can:
    - Approve hours.
    - Revoke hours.
    - Recategorize hours.
    - Reclassify hours.
    - Flag or review manual/direct entries.
11. Approved hours can be prepared for release seven days prior to month end.
12. Released totals become available in Hours by Project.
13. Hours by Project passes approved totals to Financial Management.
14. Financial Management passes invoice-ready records to Invoices.

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
| `task_name` | User-facing task or deliverable name |
| `task_type` | Normalized task type used for historical averages |
| `task_category` | Broader category, such as implementation, QA, review, reporting, or workflow configuration |
| `expected_task_count` | Number of expected tasks/deliverables for estimate calculation |
| `start_time` | Timer start timestamp or manual start time |
| `end_time` | Timer stop timestamp or manual end time |
| `duration_hours` | Calculated or manually entered hours |
| `entry_source` | Timer, Project Time Entry, or Imported |
| `manual_entry_reason` | Required when manual adjustment is used |
| `manual_entry_flag` | True when manual entry is used |
| `historical_average_hours` | Average completion time used by the estimate engine |
| `estimated_hours` | System-suggested or manually overridden estimated hours |
| `estimate_source` | Manual estimate, historical average, client average, project average, PM/user average, or weighted historical average |
| `estimate_variance_hours` | Difference between actual hours and estimated hours |
| `work_category` | Category before admin review |
| `approved_category` | Category after recategorization/reclassification |
| `status` | Draft, Submitted, Approved, Revoked, Released |
| `admin_reviewer_id` | Admin who reviewed the entry |
| `review_notes` | Internal comments |
| `released_to_client_at` | Release timestamp for Hours by Project |
| `released_to_finance_at` | Timestamp for Financial Management handoff |
| `invoice_reference` | Invoice relationship when created |

## Smart task-time estimates

CPSM should track how long tasks actually take and use historical averages to improve future estimated billable hours.

### Base average formula

```text
Average Task Time = Total Actual Hours Logged for Task Type / Number of Completed Task Entries
```

### Suggested weighted estimate formula

```text
Smart Estimate =
  50% Same Task Type Average
+ 25% Same Client Average
+ 15% Same Project Category Average
+ 10% Same PM/User Average
```

### Estimated week-to-date formula

```text
Estimated WTD Hours = Smart Average Task Time × Expected Tasks / Deliverables This Week
```

### Variance formula

```text
Variance = Actual WTD Hours - Estimated WTD Hours
```

Positive variance means the project is taking more time than estimated. Negative variance means the project is currently under the estimate.

### Estimate source labels

Every estimate should show its source so PMs and admins understand how the estimate was created.

Minimum labels:

- Manual Estimate
- Historical Average
- Client-Based Average
- Project-Based Average
- PM/User-Based Average
- Weighted Historical Average
- System Suggested Estimate

### Smart estimate behavior

1. When a PM selects a task/deliverable, CPSM checks historical task data.
2. If enough history exists, CPSM displays the historical average completion time.
3. CPSM calculates a suggested estimate using weighted historical averages.
4. The PM can accept the system estimate or override it.
5. CPSM stores the estimate source for audit and reporting.
6. After completed entries are saved, CPSM recalculates future averages.
7. Manual/direct entries remain flagged in reports.

## Task-time averages table draft

Suggested fields for a future database table:

| Field | Purpose |
| --- | --- |
| `task_average_id` | Unique task average record |
| `task_type` | Normalized task type |
| `client_id` | Optional client-specific average |
| `project_category` | Optional project category average |
| `user_id` | Optional PM/user average |
| `average_hours` | Current calculated average |
| `completed_entry_count` | Number of completed entries included |
| `last_calculated_at` | Last time the average was recalculated |

## Admin controls

Admin functions should include:

- Recategorize hours.
- Reclassify hours.
- Revoke hours.
- Approve timecards.
- Hold timecards.
- Release approved totals to Hours by Project.
- Flag manual/direct entries in reports.
- Review estimate source and variance.
- Lock entries after release unless reopened by an authorized admin.

## Timer function requirements

Timer functionality should include:

- Start timer.
- Pause timer.
- Resume timer.
- Stop timer.
- Assign timer to client and project.
- Assign timer to task/deliverable.
- Assign timer to category.
- Save timer output as billable hours.
- Prevent client visibility until approval and release.

## Manual/direct entry reporting rule

Manual/direct project time entries are allowed, but every report must flag them.

Minimum reporting indicators:

- Entry source: Timer, Project Time Entry, or Imported.
- Manual entry reason when applicable.
- Created by.
- Approved by.
- Modified by.
- Recategorized or reclassified status.
- Estimate source.
- Estimated hours.
- Actual hours.
- Variance.

## Monthly release rule

Seven days prior to the end of the month, approved timecards can be reviewed for release to Hours by Project.

The release should be optional and controlled by authorized users. Approved hours should not automatically appear to the client until release is confirmed.

## Integration map

```text
Client Onboarding
  -> Billable Hours
  -> Project Time Entry
  -> Smart Task-Time Estimates
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
