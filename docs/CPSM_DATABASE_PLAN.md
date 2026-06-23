# CPSM Database Plan

This document defines the initial backend and database direction for Client Portfolio Service Manager (CPSM).

## Backend Provider Direction

**Primary backend:** Supabase

**Database:** Supabase Postgres

**Auth direction:** Supabase Auth

**File storage direction:** Supabase Storage

**Security model:** Row Level Security (RLS), role-based permissions, and audit logging

**Supabase project:** `cpsm-production`

**Supabase project ref:** `zkydfxtmzomypkaykhod`

**Region:** `us-east-2`

**Current database status:** No public tables were found during the first read-only table check.

## Build Principle

CPSM should not place database passwords, service role keys, or private connection strings in frontend code.

Frontend pages should only use safe Supabase client configuration such as the project URL and publishable/anon key when appropriate. Any privileged database work should be handled through protected backend code, migrations, or Supabase policies.

## Primary Settings Structure

The database should support two major configuration levels:

1. System Settings Level
2. Client Company Level

This reflects the CPSM settings outline and keeps platform-wide configuration separate from client-specific configuration.

## System Settings Level

System-level settings apply across CPSM and should be limited to approved administrative users.

Initial system-level areas:

- System Settings
- Security
- User Roles
- User Access Permissions
- Client Onboarding Settings
- Workflow Center Settings

## Client Company Level

Client-company-level settings apply to a specific client organization or portfolio.

Initial client-company areas:

- Configure Client Company
- Project Management Settings
- Financial Management Settings
- Accounting
- Invoice Set-up
- Client Onboarding
- Client Directory

## Side Panel Navigation Areas

The settings structure should also support controlled side panel navigation for major workspaces:

- Workflows
- Project Management
- Financial Management
- Agreements
- Invoices
- Sales Management
- Configure Client Company
- Client Onboarding
- Client Directory

## Initial Core Tables

The first CPSM schema should start small and controlled. Recommended initial tables:

- `client_companies`
- `user_profiles`
- `roles`
- `permissions`
- `role_permissions`
- `client_user_access`
- `system_settings`
- `client_company_settings`
- `projects`
- `workflows`
- `agreements`
- `invoices`
- `audit_logs`

## Later Tables

After the core schema is stable, later tables may include:

- `financial_management_settings`
- `accounting_settings`
- `invoice_settings`
- `sales_management_settings`
- `client_directory_contacts`
- `documents`
- `notifications`
- `workflow_steps`
- `project_milestones`
- `project_risks`
- `project_issues`
- `project_change_requests`

## Security Direction

The database should use RLS and role-based access so that:

- Superusers can configure the full system.
- Admin users can manage assigned administrative areas.
- Internal project roles can access assigned clients and projects.
- Client users can access only their approved client-company workspace.
- Audit logs track important configuration, access, agreement, invoice, and project changes.

## First Migration Recommendation

The first migration should be named:

`create_cpsm_core_schema`

It should create foundational tables only, with RLS enabled. Policies should be conservative and expanded carefully after testing.

## Do Not Do Yet

Do not connect the frontend directly to production data until:

- The schema is reviewed.
- RLS is enabled.
- Initial policies are created and checked.
- Test users and roles are defined.
- The settings page is visually approved.

## Next Planned Step

Create a draft schema file in the repository before applying it to Supabase:

`supabase/schema.sql`

The schema file should be reviewed before any migration is applied to the `cpsm-production` Supabase project.

Last updated: 2026-06-23
