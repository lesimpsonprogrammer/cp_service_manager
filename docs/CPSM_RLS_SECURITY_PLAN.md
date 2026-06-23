# CPSM Row Level Security and Access Plan

This document defines the initial security direction for Client Portfolio Service Manager (CPSM) before any database migration is applied to Supabase.

## Current Status

**Supabase project:** `cpsm-production`

**Project ref:** `zkydfxtmzomypkaykhod`

**Database status:** No public tables were found during the first read-only table check.

**Schema status:** Review-only migration drafts exist in GitHub. They have not been applied to Supabase.

## Security Principle

CPSM should be secure by default.

Row Level Security (RLS) should be enabled on all application tables before frontend access is connected. Policies should be added carefully so users can only access records they are authorized to view or manage.

## Access Levels

CPSM should support two major access scopes:

1. System Settings Level
2. Client Company Level

### System Settings Level

System-level access controls platform-wide configuration. This level should be limited to trusted internal roles.

Primary system-level areas:

- System Settings
- Security
- User Roles
- User Access Permissions
- Client Onboarding Settings
- Workflow Center Settings

Recommended roles with system-level access:

- Superuser
- Admin
- Engineering Admin, only for technical setup and support areas unless temporary sudo access has been approved

### Client Company Level

Client-company-level access controls records attached to a specific client organization.

Primary client-company-level areas:

- Configure Client Company
- Project Management Settings
- Financial Management Settings
- Accounting
- Invoice Set-up
- Client Onboarding
- Client Directory
- Agreements
- Invoices
- Workflows

Recommended roles with client-company-level access:

- Superuser
- Admin
- Regional Director
- Manager
- Account Manager
- Project Manager
- Project Consultant
- Engineering Admin
- Client, limited to approved client-facing records only

## Role Direction

### Superuser

Full access across CPSM. Can configure system settings, manage all clients, manage all users, apply security settings, approve sudo access, and review audit logs.

### Admin

Broad administrative access. Can manage users, client companies, settings, projects, workflows, agreements, invoices, and audit records as assigned.

### Regional Director

Portfolio oversight across assigned regional clients and projects. Should not automatically receive full system configuration access.

### Manager

Team and project supervision for assigned clients, projects, workflows, and deliverables.

### Account Manager

Client relationship visibility and limited configuration access for assigned client companies.

### Project Manager

Project delivery ownership for assigned clients and projects.

### Project Consultant

Assigned delivery support. Can access assigned project records, workflows, and deliverables but should have limited configuration permissions.

### Engineering Admin

Technical setup and support. Can help configure technical settings but should not automatically receive broad business-financial authority.

Engineering Admin may gain temporary elevated sudo access only when approved by a Superuser. Sudo access must be tied to a user request, specific reason, defined scope, one-hour expiration, and audit logging.

### Client

Client-facing access only. Can access approved records for their assigned client company, such as project updates, agreements, invoices, deliverables, and messages. Clients should not access system settings or other client companies.

## Sudo Access Model

CPSM should support temporary, approved, audited sudo access for situations where an Engineering Admin or approved user must manage and/or assist in the absence of a Super Admin or Superuser.

### Sudo Access Rules

- **Who requested access:** the user requesting access.
- **Who approved access:** a Superuser.
- **Why access was needed:** based on the user request.
- **What scope was granted:** permission to manage and/or assist in the absence of a Super Admin or Superuser.
- **When access expires:** one hour from approval.
- **Audit logging:** every request, approval, denial, revocation, expiration, and update must be logged.

### Sudo Access Statuses

Sudo access should support these statuses:

- `requested`
- `approved`
- `expired`
- `revoked`
- `denied`

### Sudo Access Controls

Only a Superuser should approve, deny, or revoke sudo access.

Users may request sudo access for themselves only.

Approved sudo access should be time-bound and should expire automatically or be treated as inactive after the one-hour expiration window.

## Table Protection Direction

### Highest Protection

These tables should have the strictest policies:

- `system_settings`
- `roles`
- `permissions`
- `role_permissions`
- `client_user_access`
- `sudo_access_sessions`
- `audit_logs`

Only approved internal roles should manage these tables. Sudo access may temporarily extend internal admin authority only when approved and active.

### Client-Scoped Protection

These tables should be scoped by `client_company_id`:

- `client_companies`
- `client_company_settings`
- `projects`
- `workflows`
- `agreements`
- `invoices`

Users should only access these records if they have active access in `client_user_access`.

### User Profile Protection

The `user_profiles` table should allow users to read their own profile. Administrative roles may read or manage profiles based on assigned permissions.

## Policy Strategy

Initial policies should be conservative.

Recommended first policy phases:

### Phase 1 — Internal Admin Setup

Allow Superuser/Admin style access for setup and testing. Keep client users restricted until client policies are fully tested.

### Phase 2 — Client Company Access

Add policies that allow users to see records connected to client companies where they have active access in `client_user_access`.

### Phase 3 — Role Permission Checks

Add permission-based checks for create, update, and delete actions using assigned roles and permissions.

### Phase 4 — Sudo Access

Add temporary sudo access that allows approved users to gain time-bound elevated access. Sudo access must be approved by a Superuser, expire one hour from approval, and write to audit logs.

### Phase 5 — Client User Experience

Add client-facing policies for read-only or limited update access to approved client records.

## Audit Logging Direction

CPSM should log important actions, including:

- User role changes
- Permission changes
- Client company setup changes
- System settings changes
- Security settings changes
- Sudo access requests
- Sudo access approvals
- Sudo access denials
- Sudo access revocations
- Sudo access expirations
- Agreement status changes
- Invoice status changes
- Project status changes
- Workflow changes

The `audit_logs` table should not be freely editable by normal users. Ideally, audit records should be written through controlled backend logic, database functions, or audited triggers.

## Frontend Security Direction

Frontend code must not include:

- Database password
- Service role key
- JWT secret
- Private connection string
- Any private API key

Frontend code may use:

- Supabase project URL
- Publishable or anon key, when policies are ready

## Pre-Migration Checklist

Before applying migrations to Supabase:

- Review table names.
- Review role names.
- Review permission groups.
- Confirm RLS should be enabled on all application tables.
- Decide whether seed role and permission data should be included in the first migration or kept separate.
- Review initial policies.
- Review sudo access policy and expiration rules.
- Confirm no frontend page is connected before policies are ready.

## Recommended Migration Order

1. `001_create_cpsm_core_schema`
2. `002_seed_cpsm_roles_and_permissions`
3. `003_create_cpsm_initial_rls_policies`
4. `004_create_cpsm_sudo_access_model`
5. `005_create_cpsm_storage_buckets`
6. `006_create_cpsm_audit_helpers`

## Do Not Do Yet

Do not apply the draft migrations directly to production until the schema and RLS policy approach are reviewed.

Do not connect the settings page to Supabase until RLS policies and test users are in place.

Last updated: 2026-06-23
