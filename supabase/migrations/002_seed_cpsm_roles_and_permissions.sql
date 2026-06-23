-- CPSM Roles and Permissions Seed Draft
-- Migration: 002_seed_cpsm_roles_and_permissions
-- Purpose: Seed foundational roles and permission groups for Client Portfolio Service Manager.
-- Status: Review-only draft. Do not apply to Supabase until approved.

insert into public.roles (role_key, role_name, role_description)
values
  ('superuser', 'Superuser', 'Full system configuration and platform oversight'),
  ('admin', 'Admin', 'Manage users, clients, and settings'),
  ('regional_director', 'Regional Director', 'Regional portfolio oversight'),
  ('manager', 'Manager', 'Team and project supervision'),
  ('account_manager', 'Account Manager', 'Client relationship visibility'),
  ('project_manager', 'Project Manager', 'Project delivery ownership'),
  ('project_consultant', 'Project Consultant', 'Assigned delivery support'),
  ('engineering_admin', 'Engineering Admin', 'Technical setup and support'),
  ('client', 'Client', 'Client-facing project access')
on conflict (role_key) do nothing;

insert into public.permissions (permission_key, permission_name, permission_group, description)
values
  ('system_settings.manage', 'Manage System Settings', 'System Settings', 'Manage platform-level CPSM settings'),
  ('security.manage', 'Manage Security', 'Security', 'Manage security and access rules'),
  ('users.manage', 'Manage Users', 'User Access Permissions', 'Create and manage user access'),
  ('roles.manage', 'Manage Roles', 'User Roles', 'Create and manage roles and permissions'),
  ('clients.configure', 'Configure Client Company', 'Client Company Level', 'Configure client company records and preferences'),
  ('client_onboarding.manage', 'Manage Client Onboarding', 'Client Onboarding', 'Manage client onboarding settings and onboarding workflows'),
  ('projects.manage', 'Manage Projects', 'Project Management', 'Manage client projects'),
  ('workflows.manage', 'Manage Workflows', 'Workflow Center', 'Manage workflow center settings and workflow records'),
  ('financials.manage', 'Manage Financials', 'Financial Management', 'Manage financial management settings'),
  ('accounting.manage', 'Manage Accounting', 'Accounting', 'Manage accounting configuration'),
  ('agreements.manage', 'Manage Agreements', 'Agreements', 'Manage client agreements and acknowledgments'),
  ('invoices.manage', 'Manage Invoices', 'Invoices', 'Manage invoice setup and invoice records'),
  ('sales.manage', 'Manage Sales', 'Sales Management', 'Manage sales management settings'),
  ('directory.manage', 'Manage Client Directory', 'Client Directory', 'Manage client directory records'),
  ('audit_logs.view', 'View Audit Logs', 'Audit Log', 'View audit records')
on conflict (permission_key) do nothing;

-- Initial role-permission assignments should be reviewed before being added.
-- Recommended next pass:
-- 1. Assign all permissions to Superuser.
-- 2. Assign administrative permissions to Admin.
-- 3. Assign client-scoped read/manage permissions to internal delivery roles.
-- 4. Assign limited client-facing permissions to Client.
