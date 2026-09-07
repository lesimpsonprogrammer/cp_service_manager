-- New org_role value for AI agent accounts embedded directly into CPSM
-- (e.g. Jaren). Kept as its own enum value rather than reusing 'admin' so
-- agent permissions can be scoped independently of human admin permissions
-- later, without touching every policy that currently keys off 'admin'.
--
-- Must be committed on its own: Postgres will not let a newly added enum
-- value be used in the same transaction that adds it, so this has to run
-- (and commit) before 0025_ai_agents.sql, which uses 'sys_admin'.
alter type public.org_role add value if not exists 'sys_admin';
