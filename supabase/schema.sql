-- CPSM Supabase Schema Index
-- The original single-file schema draft has been split into review-only migration drafts.
-- Do not apply these migrations to Supabase until the schema and RLS strategy are approved.

-- Review order:
-- 1. supabase/migrations/001_create_cpsm_core_schema.sql
-- 2. supabase/migrations/002_seed_cpsm_roles_and_permissions.sql
-- 3. supabase/migrations/003_create_cpsm_initial_rls_policies.sql

-- Current Supabase project direction:
-- Project name: cpsm-production
-- Project ref: zkydfxtmzomypkaykhod
-- Database provider: Supabase Postgres
-- Auth direction: Supabase Auth
-- File storage direction: Supabase Storage
-- Security direction: Row Level Security and role-based access
