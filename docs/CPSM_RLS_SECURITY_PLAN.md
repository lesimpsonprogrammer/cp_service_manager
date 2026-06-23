# CPSM Row Level Security and Access Plan

This document defines the initial security direction for Client Portfolio Service Manager (CPSM) before any database migration is applied to Supabase.

## Current Status

**Supabase project:** `cpsm-production`

**Project ref:** `zkydfxtmzomypkaykhod`

**Database status:** No public tables were found during the first read-only table check.

**Schema status:** `supabase/schema.sql` exists as a review-only draft. It has not been applied to Supabase.

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
- Engineering Admin, only for technical setup and support areas

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

Full access across CPSM. Can configure system settings, manage all clients, manage all users, apply security settings, and review audit logs.

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

Technical setup and support. Can help configure technical settings but should not automatically receive business-financial authority unless assigned.

### Client

Client-facing access only. Can access approved records for their assigned client company, such as project updates, agreements, invoices, deliverables, and messages. Clients should not access system settings or other client companies.

## Table Protection Direction

### Highest Protection

These tables should have the strictest policies:

- `system_settings`
- `roles`
- `permissions`
- `role_permissions`
- `client_user_access`
- `audit_logs`

Only approved internal roles should manage these tables.

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

### Phase 4 — Client User Experience

Add client-facing policies for read-only or limited update access to approved client records.

## Audit Logging Direction

CPSM should log important actions, including:

- User role changes
- Permission changes
- Client company setup changes
- System settings changes
- Security settings changes
- Agreement status changes
- Invoice status changes
- Project status changes
- Workflow changes

The `audit_logs` table should not be freely editable by normal users. Ideally, audit records should be written through controlled backend logic or database functions.

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

Before applying `supabase/schema.sql` to Supabase:

- Review table names.
- Review role names.
- Review permission groups.
- Confirm RLS should be enabled on all application tables.
- Decide whether seed role and permission data should be included in the first migration.
- Define initial policies or prepare a second policy migration.
- Confirm no frontend page is connected before policies are ready.

## Recommended Migration Order

1. `create_cpsm_core_schema`
2. `create_cpsm_initial_rls_policies`
3. `seed_cpsm_roles_and_permissions`
4. `create_cpsm_storage_buckets`
5. `create_cpsm_audit_helpers`

## Do Not Do Yet

Do not apply the draft schema directly to production until the schema and RLS policy approach are reviewed.

Do not connect the settings page to Supabase until RLS policies and test users are in place.

Last updated: 2026-06-23
