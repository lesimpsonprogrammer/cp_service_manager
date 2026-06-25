# Connected Workflow Spine

## Approved Direction

This document captures the connected CPSM workflow approved from the Client Portal branch notes.

## Core Principle

Nearly every section of CPSM should be linked through shared identifiers, workflow records, and release states.

The primary connection points are:

- Client ID
- Project ID
- Project Deliverable Count
- Client Directory Profile
- Project Record
- Workflow Record
- Kanban Card
- Billable Hours Record
- Hours By Project Release
- Financial Management Review
- Invoice Record

## Client Onboarding Rule

When **Pull Data From Client Onboarding** is checked, CPSM should:

1. Save the client profile to the database.
2. Generate the Client ID.
3. Generate the Project ID based on client, project sequence, and number of deliverables.
4. Make the profile available in Client Directory.
5. Make the client and project available to the Project Manager.
6. Prepare the Project Manager to click **Initiate Project**.

## Example ID Generation

```text
Client: Kompan
Client ID: CLI-KOM-100100
Project Title: Paylocity Implementation
Deliverables: 5
Project ID: PRJ-KOM-005-100100
```

## Project Initiation Rule

When the Project Manager clicks **Initiate Project**, CPSM should:

1. Pull the saved Client Onboarding record.
2. Confirm the Client ID and Project ID.
3. Create or activate the project record.
4. Create and send the Welcome Email.
5. Create the first Kanban Card on the Dashboard Board.
6. Create or update the Active Workflow record.

## Initial Kanban Card

The first Kanban Card should follow the current card structure:

```text
Title: Project Initiated
Description: Project "Paylocity Implementation" Has Been Initiated On June 24, 2026.
Label: Project Initiation
Owner: Project Manager
Due / Status: PRJ-KOM-005-100100
Priority: High
Column: Intake
```

## Dashboard Workflow Widget

The Dashboard should include a Workflow Widget beneath the Kanban Cards.

The Widget should be titled:

```text
Active Workflows
```

The Widget should show an organized structured list with:

- Workflow Name
- Client
- Project ID
- Status
- Action

If a workflow cannot execute, the row should include an inline **View Missed Incident** link.

Every row should also include a **View Workflow** link that routes to the Workflow Center.

## Workflow Center

The Workflow Center should provide a detailed version of the Dashboard Workflow Widget and include:

- Workflow Name
- Client ID
- Project ID
- Project Title
- Deliverable Count
- Current Status
- Trigger Source
- Assigned Owner
- Last Action
- Next Required Action
- Missed Incident Status
- Date Created
- Date Updated

## Capitalization Standard

All user-facing component names, feature names, action labels, and workflow labels should use Title Case.

Correct examples:

- Initiate Project
- View: Kanban Cards
- View Workflow
- View Missed Incident
- Hours By Project
- Billable Hours
- Client Onboarding
- Project Management
- Financial Management
- Invoice Set-Up

## Connected Flow

```text
Client Onboarding
  -> Generate Client ID
  -> Generate Project ID Based On Deliverables
  -> Save Client Profile To Database
  -> Release To Client Directory
  -> Project Manager Clicks Initiate Project
  -> Send Welcome Email
  -> Create Initial Kanban Card
  -> Create Active Workflow Record
  -> Display In Dashboard Workflow Widget
  -> Display Full Details In Workflow Center
  -> Feed Billable Hours
  -> Feed Hours By Project
  -> Feed Financial Management
  -> Feed Invoices
```
