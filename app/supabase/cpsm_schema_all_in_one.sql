-- ==========================================================================
-- CPSM SCHEMA - ALL IN ONE: PLANNED vs LIVE
-- ==========================================================================
-- Generated from app/supabase/migrations/ (37 files, through
-- 0035_jaren_power_bi_skill.sql). Do not hand-edit: after adding a migration, rerun
--   app/scripts/schema-all-in-one/build.sh
--
-- HOW TO USE
--   Paste this whole file into the Supabase SQL editor and click Run.
--   Only Part 2 executes, and it is a single read-only SELECT: it reads
--   the system catalogs and changes nothing. Parts 1 and 3 are comments.
--
--   The result has one row per finding, sorted by section:
--     1 - Enhancement summary  one row per migration:
--                                LIVE         every object it adds is in the live DB
--                                PARTIAL      some objects missing or different
--                                NOT APPLIED  none of its objects are live
--     2 - Missing from live    planned objects the live DB doesn't have
--     3 - Live but different   present, but type / default / function body /
--                              RLS differs from the repo
--     4 - Live only            in the live DB but in no migration (drift
--                              made by hand in the dashboard or SQL editor)
--
--   Column defaults are compared as Postgres prints them; if the live
--   project runs a different Postgres major version a default can show
--   in section 3 with an equivalent spelling - compare the two columns.
--   Policies are compared by name and command, not by their USING text.

-- ==========================================================================
-- PART 1 - ENHANCEMENT ROADMAP (planned: what each migration adds)
-- ==========================================================================
-- migration                                      tables  cols policy  fns index other
--   enhancement
-- --------------------------------------------------------------------------
-- 0001_init.sql                                       9    77     13    3    20    99
--   Core platform: orgs, members, data sources, pipelines, API keys, webhooks
-- 0002_clients.sql                                    1    12      1    0     3    13
--   Clients
-- 0003_client_onboarding.sql                          1    13      1    0     3    23
--   Client onboarding + contracts
-- 0004_contract_esignature.sql                        0    21      0    0     1     5
--   Contract e-signature, client billing + compliance flags
-- 0005_agreement_templates.sql                        1     7      1    0     2     8
--   Agreement templates
-- 0006_contract_full_agreement.sql                    0     3      0    0     0     0
--   Full service-agreement contract fields
-- 0007_time_entries.sql                               2    21      2    0     8    21
--   Project time tracking
-- 0008_timecard_approvals.sql                         1    23      1    0     4    19
--   Timecard approvals
-- 0009_docs.sql                                       1     8      1    0     3     8
--   Internal docs / wiki
-- 0010_invoices.sql                                   2    30      2    0     7    32
--   Invoicing
-- 0010_tax_filing_connector.sql                       0     0      0    0     0     1
--   Tax filing connector (TaxBandits)
-- 0011_signup_approval.sql                            2    20      3    1     6    23
--   Signup approval
-- 0012_docs_categories.sql                            0     1      0    0     1     1
--   Doc categories (free text)
-- 0013_client_portal.sql                              2    14     13    1     6    21
--   Client portal
-- 0013_doc_categories.sql                             1     5      1    0     3     6
--   Managed doc category list
-- 0014_traceable_ids.sql                              0     3      0    0     3     3
--   Traceable IDs for contracts, timecards, workflows
-- 0015_password_expiry.sql                            0     2      0    0     0     2
--   30-day password expiry
-- 0016_project_manager.sql                            0     1      2    0     1     1
--   Client project manager
-- 0017_adp_paychex_connectors.sql                     0     0      0    0     0     2
--   ADP + Paychex connectors
-- 0018_pipeline_preview_and_rollback.sql              0     4      1    0     0     3
--   Pipeline preview + rollback
-- 0019_blog_posts.sql                                 1    13      1    0     4    12
--   Public blog
-- 0020_brief_download_leads.sql                       1     4      0    0     2     5
--   Executive Brief download leads
-- 0021_web_scraper_connector.sql                      0     0      0    0     0     1
--   Web scraper connector
-- 0022_workflow_center.sql                            5    48      5    0    19    53
--   Workflow Center
-- 0023_jaren_conversations.sql                        2    12      2    0     4    16
--   Jaren chat history
-- 0024_sql_editor.sql                                 1     9      1    2     2     9
--   Read-only SQL editor
-- 0025_org_role_sys_admin.sql                         0     0      0    0     0     1
--   sys_admin role for AI agents
-- 0026_ai_agents.sql                                  1     7      1    0     1     9
--   AI agent governance + autonomy settings
-- 0027_security_rules.sql                             3    37     11    1     6    60
--   Security rules + findings
-- 0028_enhancement_tasks.sql                          1    10      4    0     2    17
--   Enhancement task manager
-- 0029_enhancement_task_assignee_due_date.sql         0     2      0    0     1     0
--   Enhancement task assignee + due date
-- 0030_client_portal_roles.sql                        0     2      0    0     0     7
--   Client portal roles
-- 0031_jaren_agent_settings.sql                       1     5      2    0     1     6
--   Jaren agent skill settings
-- 0032_data_studio_postgres_rw.sql                    2    22      2    2     4    20
--   Data Studio read/write
-- 0033_data_studio_private_audit.sql                  0     0      0    1     0     3
--   Data Studio private audit helper
-- 0034_business_agreement_client_ids.sql              0     2      0    0     2     6
--   Business IDs for clients + agreements
-- 0035_jaren_power_bi_skill.sql                       0     0      0    0     0     1
--   Jaren Power BI skill
-- --------------------------------------------------------------------------
-- End state: 438 column, 186 column default, 160 constraint, 21 enum, 91 enum value, 11 function, 11 function body, 119 index, 71 policy, 3 realtime, 41 rls, 1 schema, 2 sequence, 41 table, 1 trigger

-- ==========================================================================
-- PART 2 - PLANNED vs LIVE REPORT (this is the part that runs)
-- ==========================================================================
with migrations (migration, enhancement) as (
  values
    ('0001_init.sql', 'Core platform: orgs, members, data sources, pipelines, API keys, webhooks'),
    ('0002_clients.sql', 'Clients'),
    ('0003_client_onboarding.sql', 'Client onboarding + contracts'),
    ('0004_contract_esignature.sql', 'Contract e-signature, client billing + compliance flags'),
    ('0005_agreement_templates.sql', 'Agreement templates'),
    ('0006_contract_full_agreement.sql', 'Full service-agreement contract fields'),
    ('0007_time_entries.sql', 'Project time tracking'),
    ('0008_timecard_approvals.sql', 'Timecard approvals'),
    ('0009_docs.sql', 'Internal docs / wiki'),
    ('0010_invoices.sql', 'Invoicing'),
    ('0010_tax_filing_connector.sql', 'Tax filing connector (TaxBandits)'),
    ('0011_signup_approval.sql', 'Signup approval'),
    ('0012_docs_categories.sql', 'Doc categories (free text)'),
    ('0013_client_portal.sql', 'Client portal'),
    ('0013_doc_categories.sql', 'Managed doc category list'),
    ('0014_traceable_ids.sql', 'Traceable IDs for contracts, timecards, workflows'),
    ('0015_password_expiry.sql', '30-day password expiry'),
    ('0016_project_manager.sql', 'Client project manager'),
    ('0017_adp_paychex_connectors.sql', 'ADP + Paychex connectors'),
    ('0018_pipeline_preview_and_rollback.sql', 'Pipeline preview + rollback'),
    ('0019_blog_posts.sql', 'Public blog'),
    ('0020_brief_download_leads.sql', 'Executive Brief download leads'),
    ('0021_web_scraper_connector.sql', 'Web scraper connector'),
    ('0022_workflow_center.sql', 'Workflow Center'),
    ('0023_jaren_conversations.sql', 'Jaren chat history'),
    ('0024_sql_editor.sql', 'Read-only SQL editor'),
    ('0025_org_role_sys_admin.sql', 'sys_admin role for AI agents'),
    ('0026_ai_agents.sql', 'AI agent governance + autonomy settings'),
    ('0027_security_rules.sql', 'Security rules + findings'),
    ('0028_enhancement_tasks.sql', 'Enhancement task manager'),
    ('0029_enhancement_task_assignee_due_date.sql', 'Enhancement task assignee + due date'),
    ('0030_client_portal_roles.sql', 'Client portal roles'),
    ('0031_jaren_agent_settings.sql', 'Jaren agent skill settings'),
    ('0032_data_studio_postgres_rw.sql', 'Data Studio read/write'),
    ('0033_data_studio_private_audit.sql', 'Data Studio private audit helper'),
    ('0034_business_agreement_client_ids.sql', 'Business IDs for clients + agreements'),
    ('0035_jaren_power_bi_skill.sql', 'Jaren Power BI skill')
),
planned (migration, kind, name, detail) as (
  values
    ('0001_init.sql', 'column', 'public.api_keys.created_at', 'timestamp with time zone'),
    ('0001_init.sql', 'column', 'public.api_keys.created_by', 'uuid'),
    ('0001_init.sql', 'column', 'public.api_keys.id', 'uuid'),
    ('0001_init.sql', 'column', 'public.api_keys.key_hash', 'text'),
    ('0001_init.sql', 'column', 'public.api_keys.key_prefix', 'text'),
    ('0001_init.sql', 'column', 'public.api_keys.last_used_at', 'timestamp with time zone'),
    ('0001_init.sql', 'column', 'public.api_keys.name', 'text'),
    ('0001_init.sql', 'column', 'public.api_keys.org_id', 'uuid'),
    ('0001_init.sql', 'column', 'public.api_keys.revoked_at', 'timestamp with time zone'),
    ('0001_init.sql', 'column', 'public.data_sources.config', 'jsonb'),
    ('0001_init.sql', 'column', 'public.data_sources.created_at', 'timestamp with time zone'),
    ('0001_init.sql', 'column', 'public.data_sources.created_by', 'uuid'),
    ('0001_init.sql', 'column', 'public.data_sources.id', 'uuid'),
    ('0001_init.sql', 'column', 'public.data_sources.last_synced_at', 'timestamp with time zone'),
    ('0001_init.sql', 'column', 'public.data_sources.name', 'text'),
    ('0001_init.sql', 'column', 'public.data_sources.org_id', 'uuid'),
    ('0001_init.sql', 'column', 'public.data_sources.secret_ref', 'text'),
    ('0001_init.sql', 'column', 'public.data_sources.status', 'data_source_status'),
    ('0001_init.sql', 'column', 'public.data_sources.type', 'data_source_type'),
    ('0001_init.sql', 'column', 'public.data_sources.updated_at', 'timestamp with time zone'),
    ('0001_init.sql', 'column', 'public.org_members.created_at', 'timestamp with time zone'),
    ('0001_init.sql', 'column', 'public.org_members.org_id', 'uuid'),
    ('0001_init.sql', 'column', 'public.org_members.role', 'org_role'),
    ('0001_init.sql', 'column', 'public.org_members.user_id', 'uuid'),
    ('0001_init.sql', 'column', 'public.organizations.created_at', 'timestamp with time zone'),
    ('0001_init.sql', 'column', 'public.organizations.id', 'uuid'),
    ('0001_init.sql', 'column', 'public.organizations.name', 'text'),
    ('0001_init.sql', 'column', 'public.organizations.slug', 'text'),
    ('0001_init.sql', 'column', 'public.pipeline_runs.created_at', 'timestamp with time zone'),
    ('0001_init.sql', 'column', 'public.pipeline_runs.error', 'text'),
    ('0001_init.sql', 'column', 'public.pipeline_runs.finished_at', 'timestamp with time zone'),
    ('0001_init.sql', 'column', 'public.pipeline_runs.id', 'uuid'),
    ('0001_init.sql', 'column', 'public.pipeline_runs.org_id', 'uuid'),
    ('0001_init.sql', 'column', 'public.pipeline_runs.pipeline_id', 'uuid'),
    ('0001_init.sql', 'column', 'public.pipeline_runs.records_extracted', 'integer'),
    ('0001_init.sql', 'column', 'public.pipeline_runs.records_failed', 'integer'),
    ('0001_init.sql', 'column', 'public.pipeline_runs.records_loaded', 'integer'),
    ('0001_init.sql', 'column', 'public.pipeline_runs.started_at', 'timestamp with time zone'),
    ('0001_init.sql', 'column', 'public.pipeline_runs.status', 'pipeline_run_status'),
    ('0001_init.sql', 'column', 'public.pipeline_runs.triggered_by', 'text'),
    ('0001_init.sql', 'column', 'public.pipelines.created_at', 'timestamp with time zone'),
    ('0001_init.sql', 'column', 'public.pipelines.created_by', 'uuid'),
    ('0001_init.sql', 'column', 'public.pipelines.destination_id', 'uuid'),
    ('0001_init.sql', 'column', 'public.pipelines.id', 'uuid'),
    ('0001_init.sql', 'column', 'public.pipelines.is_active', 'boolean'),
    ('0001_init.sql', 'column', 'public.pipelines.mapping', 'jsonb'),
    ('0001_init.sql', 'column', 'public.pipelines.name', 'text'),
    ('0001_init.sql', 'column', 'public.pipelines.org_id', 'uuid'),
    ('0001_init.sql', 'column', 'public.pipelines.schedule', 'text'),
    ('0001_init.sql', 'column', 'public.pipelines.source_id', 'uuid'),
    ('0001_init.sql', 'column', 'public.pipelines.transform_steps', 'jsonb'),
    ('0001_init.sql', 'column', 'public.pipelines.updated_at', 'timestamp with time zone'),
    ('0001_init.sql', 'column', 'public.profiles.avatar_url', 'text'),
    ('0001_init.sql', 'column', 'public.profiles.created_at', 'timestamp with time zone'),
    ('0001_init.sql', 'column', 'public.profiles.full_name', 'text'),
    ('0001_init.sql', 'column', 'public.profiles.id', 'uuid'),
    ('0001_init.sql', 'column', 'public.webhook_deliveries.created_at', 'timestamp with time zone'),
    ('0001_init.sql', 'column', 'public.webhook_deliveries.direction', 'webhook_direction'),
    ('0001_init.sql', 'column', 'public.webhook_deliveries.error', 'text'),
    ('0001_init.sql', 'column', 'public.webhook_deliveries.event', 'text'),
    ('0001_init.sql', 'column', 'public.webhook_deliveries.id', 'uuid'),
    ('0001_init.sql', 'column', 'public.webhook_deliveries.org_id', 'uuid'),
    ('0001_init.sql', 'column', 'public.webhook_deliveries.payload', 'jsonb'),
    ('0001_init.sql', 'column', 'public.webhook_deliveries.response_status', 'integer'),
    ('0001_init.sql', 'column', 'public.webhook_deliveries.success', 'boolean'),
    ('0001_init.sql', 'column', 'public.webhook_deliveries.webhook_id', 'uuid'),
    ('0001_init.sql', 'column', 'public.webhooks.created_at', 'timestamp with time zone'),
    ('0001_init.sql', 'column', 'public.webhooks.data_source_id', 'uuid'),
    ('0001_init.sql', 'column', 'public.webhooks.direction', 'webhook_direction'),
    ('0001_init.sql', 'column', 'public.webhooks.events', 'text[]'),
    ('0001_init.sql', 'column', 'public.webhooks.id', 'uuid'),
    ('0001_init.sql', 'column', 'public.webhooks.inbound_token', 'text'),
    ('0001_init.sql', 'column', 'public.webhooks.is_active', 'boolean'),
    ('0001_init.sql', 'column', 'public.webhooks.name', 'text'),
    ('0001_init.sql', 'column', 'public.webhooks.org_id', 'uuid'),
    ('0001_init.sql', 'column', 'public.webhooks.secret', 'text'),
    ('0001_init.sql', 'column', 'public.webhooks.target_url', 'text'),
    ('0001_init.sql', 'column default', 'public.api_keys.created_at', 'now()'),
    ('0001_init.sql', 'column default', 'public.api_keys.id', 'gen_random_uuid()'),
    ('0001_init.sql', 'column default', 'public.data_sources.config', '''{}''::jsonb'),
    ('0001_init.sql', 'column default', 'public.data_sources.created_at', 'now()'),
    ('0001_init.sql', 'column default', 'public.data_sources.id', 'gen_random_uuid()'),
    ('0001_init.sql', 'column default', 'public.data_sources.status', '''pending''::data_source_status'),
    ('0001_init.sql', 'column default', 'public.data_sources.updated_at', 'now()'),
    ('0001_init.sql', 'column default', 'public.org_members.created_at', 'now()'),
    ('0001_init.sql', 'column default', 'public.org_members.role', '''member''::org_role'),
    ('0001_init.sql', 'column default', 'public.organizations.created_at', 'now()'),
    ('0001_init.sql', 'column default', 'public.organizations.id', 'gen_random_uuid()'),
    ('0001_init.sql', 'column default', 'public.pipeline_runs.created_at', 'now()'),
    ('0001_init.sql', 'column default', 'public.pipeline_runs.id', 'gen_random_uuid()'),
    ('0001_init.sql', 'column default', 'public.pipeline_runs.records_extracted', '0'),
    ('0001_init.sql', 'column default', 'public.pipeline_runs.records_failed', '0'),
    ('0001_init.sql', 'column default', 'public.pipeline_runs.records_loaded', '0'),
    ('0001_init.sql', 'column default', 'public.pipeline_runs.status', '''queued''::pipeline_run_status'),
    ('0001_init.sql', 'column default', 'public.pipeline_runs.triggered_by', '''manual''::text'),
    ('0001_init.sql', 'column default', 'public.pipelines.created_at', 'now()'),
    ('0001_init.sql', 'column default', 'public.pipelines.id', 'gen_random_uuid()'),
    ('0001_init.sql', 'column default', 'public.pipelines.is_active', 'true'),
    ('0001_init.sql', 'column default', 'public.pipelines.mapping', '''[]''::jsonb'),
    ('0001_init.sql', 'column default', 'public.pipelines.transform_steps', '''[]''::jsonb'),
    ('0001_init.sql', 'column default', 'public.pipelines.updated_at', 'now()'),
    ('0001_init.sql', 'column default', 'public.profiles.created_at', 'now()'),
    ('0001_init.sql', 'column default', 'public.webhook_deliveries.created_at', 'now()'),
    ('0001_init.sql', 'column default', 'public.webhook_deliveries.id', 'gen_random_uuid()'),
    ('0001_init.sql', 'column default', 'public.webhook_deliveries.payload', '''{}''::jsonb'),
    ('0001_init.sql', 'column default', 'public.webhook_deliveries.success', 'false'),
    ('0001_init.sql', 'column default', 'public.webhooks.created_at', 'now()'),
    ('0001_init.sql', 'column default', 'public.webhooks.events', '''{}''::text[]'),
    ('0001_init.sql', 'column default', 'public.webhooks.id', 'gen_random_uuid()'),
    ('0001_init.sql', 'column default', 'public.webhooks.is_active', 'true'),
    ('0001_init.sql', 'constraint', 'public.api_keys : api_keys_created_by_fkey', 'foreign key'),
    ('0001_init.sql', 'constraint', 'public.api_keys : api_keys_org_id_fkey', 'foreign key'),
    ('0001_init.sql', 'constraint', 'public.api_keys : api_keys_pkey', 'primary key'),
    ('0001_init.sql', 'constraint', 'public.data_sources : data_sources_created_by_fkey', 'foreign key'),
    ('0001_init.sql', 'constraint', 'public.data_sources : data_sources_org_id_fkey', 'foreign key'),
    ('0001_init.sql', 'constraint', 'public.data_sources : data_sources_pkey', 'primary key'),
    ('0001_init.sql', 'constraint', 'public.org_members : org_members_org_id_fkey', 'foreign key'),
    ('0001_init.sql', 'constraint', 'public.org_members : org_members_pkey', 'primary key'),
    ('0001_init.sql', 'constraint', 'public.org_members : org_members_user_id_fkey', 'foreign key'),
    ('0001_init.sql', 'constraint', 'public.organizations : organizations_pkey', 'primary key'),
    ('0001_init.sql', 'constraint', 'public.organizations : organizations_slug_key', 'unique'),
    ('0001_init.sql', 'constraint', 'public.pipeline_runs : pipeline_runs_org_id_fkey', 'foreign key'),
    ('0001_init.sql', 'constraint', 'public.pipeline_runs : pipeline_runs_pipeline_id_fkey', 'foreign key'),
    ('0001_init.sql', 'constraint', 'public.pipeline_runs : pipeline_runs_pkey', 'primary key'),
    ('0001_init.sql', 'constraint', 'public.pipelines : pipelines_created_by_fkey', 'foreign key'),
    ('0001_init.sql', 'constraint', 'public.pipelines : pipelines_destination_id_fkey', 'foreign key'),
    ('0001_init.sql', 'constraint', 'public.pipelines : pipelines_org_id_fkey', 'foreign key'),
    ('0001_init.sql', 'constraint', 'public.pipelines : pipelines_pkey', 'primary key'),
    ('0001_init.sql', 'constraint', 'public.pipelines : pipelines_source_id_fkey', 'foreign key'),
    ('0001_init.sql', 'constraint', 'public.profiles : profiles_id_fkey', 'foreign key'),
    ('0001_init.sql', 'constraint', 'public.profiles : profiles_pkey', 'primary key'),
    ('0001_init.sql', 'constraint', 'public.webhook_deliveries : webhook_deliveries_org_id_fkey', 'foreign key'),
    ('0001_init.sql', 'constraint', 'public.webhook_deliveries : webhook_deliveries_pkey', 'primary key'),
    ('0001_init.sql', 'constraint', 'public.webhook_deliveries : webhook_deliveries_webhook_id_fkey', 'foreign key'),
    ('0001_init.sql', 'constraint', 'public.webhooks : webhooks_data_source_id_fkey', 'foreign key'),
    ('0001_init.sql', 'constraint', 'public.webhooks : webhooks_inbound_token_key', 'unique'),
    ('0001_init.sql', 'constraint', 'public.webhooks : webhooks_org_id_fkey', 'foreign key'),
    ('0001_init.sql', 'constraint', 'public.webhooks : webhooks_pkey', 'primary key'),
    ('0001_init.sql', 'enum', 'public.data_source_status', ''),
    ('0001_init.sql', 'enum', 'public.data_source_type', ''),
    ('0001_init.sql', 'enum', 'public.org_role', ''),
    ('0001_init.sql', 'enum', 'public.pipeline_run_status', ''),
    ('0001_init.sql', 'enum', 'public.webhook_direction', ''),
    ('0001_init.sql', 'enum value', 'public.data_source_status.connected', ''),
    ('0001_init.sql', 'enum value', 'public.data_source_status.disconnected', ''),
    ('0001_init.sql', 'enum value', 'public.data_source_status.error', ''),
    ('0001_init.sql', 'enum value', 'public.data_source_status.pending', ''),
    ('0001_init.sql', 'enum value', 'public.data_source_type.erp', ''),
    ('0001_init.sql', 'enum value', 'public.data_source_type.google_sheets', ''),
    ('0001_init.sql', 'enum value', 'public.data_source_type.hcm', ''),
    ('0001_init.sql', 'enum value', 'public.data_source_type.rest_api', ''),
    ('0001_init.sql', 'enum value', 'public.data_source_type.spreadsheet', ''),
    ('0001_init.sql', 'enum value', 'public.data_source_type.sql_database', ''),
    ('0001_init.sql', 'enum value', 'public.data_source_type.webhook', ''),
    ('0001_init.sql', 'enum value', 'public.org_role.admin', ''),
    ('0001_init.sql', 'enum value', 'public.org_role.member', ''),
    ('0001_init.sql', 'enum value', 'public.org_role.owner', ''),
    ('0001_init.sql', 'enum value', 'public.org_role.viewer', ''),
    ('0001_init.sql', 'enum value', 'public.pipeline_run_status.failed', ''),
    ('0001_init.sql', 'enum value', 'public.pipeline_run_status.partial', ''),
    ('0001_init.sql', 'enum value', 'public.pipeline_run_status.queued', ''),
    ('0001_init.sql', 'enum value', 'public.pipeline_run_status.running', ''),
    ('0001_init.sql', 'enum value', 'public.pipeline_run_status.succeeded', ''),
    ('0001_init.sql', 'enum value', 'public.webhook_direction.inbound', ''),
    ('0001_init.sql', 'enum value', 'public.webhook_direction.outbound', ''),
    ('0001_init.sql', 'function', 'public.handle_new_user()', ''),
    ('0001_init.sql', 'function', 'public.is_org_admin(check_org_id uuid)', ''),
    ('0001_init.sql', 'function', 'public.is_org_member(check_org_id uuid)', ''),
    ('0001_init.sql', 'function body', 'public.is_org_member(check_org_id uuid)', 'efe95d1c1e57358f188b31bf352551a8'),
    ('0001_init.sql', 'index', 'public.api_keys_key_hash_idx', ''),
    ('0001_init.sql', 'index', 'public.api_keys_org_id_idx', ''),
    ('0001_init.sql', 'index', 'public.api_keys_pkey', ''),
    ('0001_init.sql', 'index', 'public.data_sources_org_id_idx', ''),
    ('0001_init.sql', 'index', 'public.data_sources_pkey', ''),
    ('0001_init.sql', 'index', 'public.org_members_pkey', ''),
    ('0001_init.sql', 'index', 'public.org_members_user_id_idx', ''),
    ('0001_init.sql', 'index', 'public.organizations_pkey', ''),
    ('0001_init.sql', 'index', 'public.organizations_slug_key', ''),
    ('0001_init.sql', 'index', 'public.pipeline_runs_org_id_idx', ''),
    ('0001_init.sql', 'index', 'public.pipeline_runs_pipeline_id_idx', ''),
    ('0001_init.sql', 'index', 'public.pipeline_runs_pkey', ''),
    ('0001_init.sql', 'index', 'public.pipelines_org_id_idx', ''),
    ('0001_init.sql', 'index', 'public.pipelines_pkey', ''),
    ('0001_init.sql', 'index', 'public.profiles_pkey', ''),
    ('0001_init.sql', 'index', 'public.webhook_deliveries_pkey', ''),
    ('0001_init.sql', 'index', 'public.webhook_deliveries_webhook_id_idx', ''),
    ('0001_init.sql', 'index', 'public.webhooks_inbound_token_key', ''),
    ('0001_init.sql', 'index', 'public.webhooks_org_id_idx', ''),
    ('0001_init.sql', 'index', 'public.webhooks_pkey', ''),
    ('0001_init.sql', 'policy', 'public.api_keys : org admins can manage api keys', 'ALL'),
    ('0001_init.sql', 'policy', 'public.data_sources : org members can manage data sources', 'ALL'),
    ('0001_init.sql', 'policy', 'public.org_members : org admins can manage roster', 'ALL'),
    ('0001_init.sql', 'policy', 'public.org_members : org members can view roster', 'SELECT'),
    ('0001_init.sql', 'policy', 'public.organizations : org admins can update their organization', 'UPDATE'),
    ('0001_init.sql', 'policy', 'public.organizations : org members can view their organizations', 'SELECT'),
    ('0001_init.sql', 'policy', 'public.pipeline_runs : org members can insert pipeline runs', 'INSERT'),
    ('0001_init.sql', 'policy', 'public.pipeline_runs : org members can view pipeline runs', 'SELECT'),
    ('0001_init.sql', 'policy', 'public.pipelines : org members can manage pipelines', 'ALL'),
    ('0001_init.sql', 'policy', 'public.profiles : users can update their own profile', 'UPDATE'),
    ('0001_init.sql', 'policy', 'public.profiles : users can view their own profile', 'SELECT'),
    ('0001_init.sql', 'policy', 'public.webhook_deliveries : org members can view webhook deliveries', 'SELECT'),
    ('0001_init.sql', 'policy', 'public.webhooks : org admins can manage webhooks', 'ALL'),
    ('0001_init.sql', 'rls', 'public.api_keys', 'enabled'),
    ('0001_init.sql', 'rls', 'public.data_sources', 'enabled'),
    ('0001_init.sql', 'rls', 'public.org_members', 'enabled'),
    ('0001_init.sql', 'rls', 'public.organizations', 'enabled'),
    ('0001_init.sql', 'rls', 'public.pipeline_runs', 'enabled'),
    ('0001_init.sql', 'rls', 'public.pipelines', 'enabled'),
    ('0001_init.sql', 'rls', 'public.profiles', 'enabled'),
    ('0001_init.sql', 'rls', 'public.webhook_deliveries', 'enabled'),
    ('0001_init.sql', 'rls', 'public.webhooks', 'enabled'),
    ('0001_init.sql', 'table', 'public.api_keys', ''),
    ('0001_init.sql', 'table', 'public.data_sources', ''),
    ('0001_init.sql', 'table', 'public.org_members', ''),
    ('0001_init.sql', 'table', 'public.organizations', ''),
    ('0001_init.sql', 'table', 'public.pipeline_runs', ''),
    ('0001_init.sql', 'table', 'public.pipelines', ''),
    ('0001_init.sql', 'table', 'public.profiles', ''),
    ('0001_init.sql', 'table', 'public.webhook_deliveries', ''),
    ('0001_init.sql', 'table', 'public.webhooks', ''),
    ('0001_init.sql', 'trigger', 'auth.users : on_auth_user_created', ''),
    ('0002_clients.sql', 'column', 'public.clients.created_at', 'timestamp with time zone'),
    ('0002_clients.sql', 'column', 'public.clients.created_by', 'uuid'),
    ('0002_clients.sql', 'column', 'public.clients.id', 'uuid'),
    ('0002_clients.sql', 'column', 'public.clients.name', 'text'),
    ('0002_clients.sql', 'column', 'public.clients.notes', 'text'),
    ('0002_clients.sql', 'column', 'public.clients.org_id', 'uuid'),
    ('0002_clients.sql', 'column', 'public.clients.primary_contact_email', 'text'),
    ('0002_clients.sql', 'column', 'public.clients.primary_contact_name', 'text'),
    ('0002_clients.sql', 'column', 'public.clients.primary_contact_phone', 'text'),
    ('0002_clients.sql', 'column', 'public.clients.status', 'client_status'),
    ('0002_clients.sql', 'column', 'public.clients.updated_at', 'timestamp with time zone'),
    ('0002_clients.sql', 'column', 'public.data_sources.client_id', 'uuid'),
    ('0002_clients.sql', 'column default', 'public.clients.created_at', 'now()'),
    ('0002_clients.sql', 'column default', 'public.clients.id', 'gen_random_uuid()'),
    ('0002_clients.sql', 'column default', 'public.clients.status', '''active''::client_status'),
    ('0002_clients.sql', 'column default', 'public.clients.updated_at', 'now()'),
    ('0002_clients.sql', 'constraint', 'public.clients : clients_created_by_fkey', 'foreign key'),
    ('0002_clients.sql', 'constraint', 'public.clients : clients_org_id_fkey', 'foreign key'),
    ('0002_clients.sql', 'constraint', 'public.clients : clients_pkey', 'primary key'),
    ('0002_clients.sql', 'constraint', 'public.data_sources : data_sources_client_id_fkey', 'foreign key'),
    ('0002_clients.sql', 'enum', 'public.client_status', ''),
    ('0002_clients.sql', 'enum value', 'public.client_status.active', ''),
    ('0002_clients.sql', 'enum value', 'public.client_status.inactive', ''),
    ('0002_clients.sql', 'enum value', 'public.client_status.prospect', ''),
    ('0002_clients.sql', 'index', 'public.clients_org_id_idx', ''),
    ('0002_clients.sql', 'index', 'public.clients_pkey', ''),
    ('0002_clients.sql', 'index', 'public.data_sources_client_id_idx', ''),
    ('0002_clients.sql', 'policy', 'public.clients : org members can manage clients', 'ALL'),
    ('0002_clients.sql', 'rls', 'public.clients', 'enabled'),
    ('0002_clients.sql', 'table', 'public.clients', ''),
    ('0003_client_onboarding.sql', 'column', 'public.client_contracts.client_id', 'uuid'),
    ('0003_client_onboarding.sql', 'column', 'public.client_contracts.created_at', 'timestamp with time zone'),
    ('0003_client_onboarding.sql', 'column', 'public.client_contracts.created_by', 'uuid'),
    ('0003_client_onboarding.sql', 'column', 'public.client_contracts.end_date', 'date'),
    ('0003_client_onboarding.sql', 'column', 'public.client_contracts.id', 'uuid'),
    ('0003_client_onboarding.sql', 'column', 'public.client_contracts.name', 'text'),
    ('0003_client_onboarding.sql', 'column', 'public.client_contracts.notes', 'text'),
    ('0003_client_onboarding.sql', 'column', 'public.client_contracts.org_id', 'uuid'),
    ('0003_client_onboarding.sql', 'column', 'public.client_contracts.start_date', 'date'),
    ('0003_client_onboarding.sql', 'column', 'public.client_contracts.status', 'contract_status'),
    ('0003_client_onboarding.sql', 'column', 'public.client_contracts.updated_at', 'timestamp with time zone'),
    ('0003_client_onboarding.sql', 'column', 'public.client_contracts.value', 'numeric(12,2)'),
    ('0003_client_onboarding.sql', 'column', 'public.clients.onboarding_stage', 'onboarding_stage'),
    ('0003_client_onboarding.sql', 'column default', 'public.client_contracts.created_at', 'now()'),
    ('0003_client_onboarding.sql', 'column default', 'public.client_contracts.id', 'gen_random_uuid()'),
    ('0003_client_onboarding.sql', 'column default', 'public.client_contracts.status', '''draft''::contract_status'),
    ('0003_client_onboarding.sql', 'column default', 'public.client_contracts.updated_at', 'now()'),
    ('0003_client_onboarding.sql', 'column default', 'public.clients.onboarding_stage', '''not_started''::onboarding_stage'),
    ('0003_client_onboarding.sql', 'constraint', 'public.client_contracts : client_contracts_client_id_fkey', 'foreign key'),
    ('0003_client_onboarding.sql', 'constraint', 'public.client_contracts : client_contracts_created_by_fkey', 'foreign key'),
    ('0003_client_onboarding.sql', 'constraint', 'public.client_contracts : client_contracts_org_id_fkey', 'foreign key'),
    ('0003_client_onboarding.sql', 'constraint', 'public.client_contracts : client_contracts_pkey', 'primary key'),
    ('0003_client_onboarding.sql', 'enum', 'public.contract_status', ''),
    ('0003_client_onboarding.sql', 'enum', 'public.onboarding_stage', ''),
    ('0003_client_onboarding.sql', 'enum value', 'public.contract_status.active', ''),
    ('0003_client_onboarding.sql', 'enum value', 'public.contract_status.draft', ''),
    ('0003_client_onboarding.sql', 'enum value', 'public.contract_status.expired', ''),
    ('0003_client_onboarding.sql', 'enum value', 'public.contract_status.sent', ''),
    ('0003_client_onboarding.sql', 'enum value', 'public.contract_status.signed', ''),
    ('0003_client_onboarding.sql', 'enum value', 'public.contract_status.terminated', ''),
    ('0003_client_onboarding.sql', 'enum value', 'public.onboarding_stage.completed', ''),
    ('0003_client_onboarding.sql', 'enum value', 'public.onboarding_stage.contract_sent', ''),
    ('0003_client_onboarding.sql', 'enum value', 'public.onboarding_stage.contract_signed', ''),
    ('0003_client_onboarding.sql', 'enum value', 'public.onboarding_stage.in_progress', ''),
    ('0003_client_onboarding.sql', 'enum value', 'public.onboarding_stage.not_started', ''),
    ('0003_client_onboarding.sql', 'index', 'public.client_contracts_client_id_idx', ''),
    ('0003_client_onboarding.sql', 'index', 'public.client_contracts_org_id_idx', ''),
    ('0003_client_onboarding.sql', 'index', 'public.client_contracts_pkey', ''),
    ('0003_client_onboarding.sql', 'policy', 'public.client_contracts : org members can manage client contracts', 'ALL'),
    ('0003_client_onboarding.sql', 'rls', 'public.client_contracts', 'enabled'),
    ('0003_client_onboarding.sql', 'table', 'public.client_contracts', ''),
    ('0004_contract_esignature.sql', 'column', 'public.client_contracts.approved_at', 'timestamp with time zone'),
    ('0004_contract_esignature.sql', 'column', 'public.client_contracts.approved_by', 'uuid'),
    ('0004_contract_esignature.sql', 'column', 'public.client_contracts.last_reminder_at', 'timestamp with time zone'),
    ('0004_contract_esignature.sql', 'column', 'public.client_contracts.reminder_count', 'integer'),
    ('0004_contract_esignature.sql', 'column', 'public.client_contracts.sent_at', 'timestamp with time zone'),
    ('0004_contract_esignature.sql', 'column', 'public.client_contracts.signed_at', 'timestamp with time zone'),
    ('0004_contract_esignature.sql', 'column', 'public.client_contracts.signed_by_name', 'text'),
    ('0004_contract_esignature.sql', 'column', 'public.client_contracts.signer_email', 'text'),
    ('0004_contract_esignature.sql', 'column', 'public.client_contracts.signer_ip', 'text'),
    ('0004_contract_esignature.sql', 'column', 'public.client_contracts.signer_name', 'text'),
    ('0004_contract_esignature.sql', 'column', 'public.client_contracts.signing_token', 'uuid'),
    ('0004_contract_esignature.sql', 'column', 'public.clients.billing_contact_email', 'text'),
    ('0004_contract_esignature.sql', 'column', 'public.clients.billing_contact_name', 'text'),
    ('0004_contract_esignature.sql', 'column', 'public.clients.billing_contact_phone', 'text'),
    ('0004_contract_esignature.sql', 'column', 'public.clients.compliance_frameworks', 'text[]'),
    ('0004_contract_esignature.sql', 'column', 'public.clients.compliance_notes', 'text'),
    ('0004_contract_esignature.sql', 'column', 'public.clients.hipaa_covered_entity', 'boolean'),
    ('0004_contract_esignature.sql', 'column', 'public.clients.momentum_billing_contact_email', 'text'),
    ('0004_contract_esignature.sql', 'column', 'public.clients.momentum_billing_contact_name', 'text'),
    ('0004_contract_esignature.sql', 'column', 'public.clients.payment_method', 'text'),
    ('0004_contract_esignature.sql', 'column', 'public.clients.payment_terms', 'text'),
    ('0004_contract_esignature.sql', 'column default', 'public.client_contracts.reminder_count', '0'),
    ('0004_contract_esignature.sql', 'column default', 'public.client_contracts.signing_token', 'gen_random_uuid()'),
    ('0004_contract_esignature.sql', 'column default', 'public.clients.compliance_frameworks', '''{}''::text[]'),
    ('0004_contract_esignature.sql', 'column default', 'public.clients.hipaa_covered_entity', 'false'),
    ('0004_contract_esignature.sql', 'constraint', 'public.client_contracts : client_contracts_approved_by_fkey', 'foreign key'),
    ('0004_contract_esignature.sql', 'index', 'public.client_contracts_signing_token_idx', ''),
    ('0005_agreement_templates.sql', 'column', 'public.agreement_templates.body', 'text'),
    ('0005_agreement_templates.sql', 'column', 'public.agreement_templates.created_at', 'timestamp with time zone'),
    ('0005_agreement_templates.sql', 'column', 'public.agreement_templates.created_by', 'uuid'),
    ('0005_agreement_templates.sql', 'column', 'public.agreement_templates.id', 'uuid'),
    ('0005_agreement_templates.sql', 'column', 'public.agreement_templates.name', 'text'),
    ('0005_agreement_templates.sql', 'column', 'public.agreement_templates.org_id', 'uuid'),
    ('0005_agreement_templates.sql', 'column', 'public.agreement_templates.updated_at', 'timestamp with time zone'),
    ('0005_agreement_templates.sql', 'column default', 'public.agreement_templates.body', '''''::text'),
    ('0005_agreement_templates.sql', 'column default', 'public.agreement_templates.created_at', 'now()'),
    ('0005_agreement_templates.sql', 'column default', 'public.agreement_templates.id', 'gen_random_uuid()'),
    ('0005_agreement_templates.sql', 'column default', 'public.agreement_templates.updated_at', 'now()'),
    ('0005_agreement_templates.sql', 'constraint', 'public.agreement_templates : agreement_templates_created_by_fkey', 'foreign key'),
    ('0005_agreement_templates.sql', 'constraint', 'public.agreement_templates : agreement_templates_org_id_fkey', 'foreign key'),
    ('0005_agreement_templates.sql', 'constraint', 'public.agreement_templates : agreement_templates_pkey', 'primary key'),
    ('0005_agreement_templates.sql', 'index', 'public.agreement_templates_org_id_idx', ''),
    ('0005_agreement_templates.sql', 'index', 'public.agreement_templates_pkey', ''),
    ('0005_agreement_templates.sql', 'policy', 'public.agreement_templates : org members can manage agreement templates', 'ALL'),
    ('0005_agreement_templates.sql', 'rls', 'public.agreement_templates', 'enabled'),
    ('0005_agreement_templates.sql', 'table', 'public.agreement_templates', ''),
    ('0006_contract_full_agreement.sql', 'column', 'public.client_contracts.client_address', 'text'),
    ('0006_contract_full_agreement.sql', 'column', 'public.client_contracts.hourly_rate', 'numeric(10,2)'),
    ('0006_contract_full_agreement.sql', 'column', 'public.client_contracts.services_description', 'text'),
    ('0007_time_entries.sql', 'column', 'public.projects.client_id', 'uuid'),
    ('0007_time_entries.sql', 'column', 'public.projects.created_at', 'timestamp with time zone'),
    ('0007_time_entries.sql', 'column', 'public.projects.created_by', 'uuid'),
    ('0007_time_entries.sql', 'column', 'public.projects.id', 'uuid'),
    ('0007_time_entries.sql', 'column', 'public.projects.name', 'text'),
    ('0007_time_entries.sql', 'column', 'public.projects.org_id', 'uuid'),
    ('0007_time_entries.sql', 'column', 'public.projects.project_code', 'text'),
    ('0007_time_entries.sql', 'column', 'public.projects.status', 'text'),
    ('0007_time_entries.sql', 'column', 'public.projects.updated_at', 'timestamp with time zone'),
    ('0007_time_entries.sql', 'column', 'public.time_entries.billable', 'boolean'),
    ('0007_time_entries.sql', 'column', 'public.time_entries.client_id', 'uuid'),
    ('0007_time_entries.sql', 'column', 'public.time_entries.contract_id', 'uuid'),
    ('0007_time_entries.sql', 'column', 'public.time_entries.created_at', 'timestamp with time zone'),
    ('0007_time_entries.sql', 'column', 'public.time_entries.created_by', 'uuid'),
    ('0007_time_entries.sql', 'column', 'public.time_entries.description', 'text'),
    ('0007_time_entries.sql', 'column', 'public.time_entries.hours', 'numeric(6,2)'),
    ('0007_time_entries.sql', 'column', 'public.time_entries.id', 'uuid'),
    ('0007_time_entries.sql', 'column', 'public.time_entries.org_id', 'uuid'),
    ('0007_time_entries.sql', 'column', 'public.time_entries.project_id', 'uuid'),
    ('0007_time_entries.sql', 'column', 'public.time_entries.updated_at', 'timestamp with time zone'),
    ('0007_time_entries.sql', 'column', 'public.time_entries.work_date', 'date'),
    ('0007_time_entries.sql', 'column default', 'public.projects.created_at', 'now()'),
    ('0007_time_entries.sql', 'column default', 'public.projects.id', 'gen_random_uuid()'),
    ('0007_time_entries.sql', 'column default', 'public.projects.updated_at', 'now()'),
    ('0007_time_entries.sql', 'column default', 'public.time_entries.billable', 'true'),
    ('0007_time_entries.sql', 'column default', 'public.time_entries.created_at', 'now()'),
    ('0007_time_entries.sql', 'column default', 'public.time_entries.id', 'gen_random_uuid()'),
    ('0007_time_entries.sql', 'column default', 'public.time_entries.updated_at', 'now()'),
    ('0007_time_entries.sql', 'column default', 'public.time_entries.work_date', 'CURRENT_DATE'),
    ('0007_time_entries.sql', 'constraint', 'public.projects : projects_client_id_fkey', 'foreign key'),
    ('0007_time_entries.sql', 'constraint', 'public.projects : projects_created_by_fkey', 'foreign key'),
    ('0007_time_entries.sql', 'constraint', 'public.projects : projects_org_id_fkey', 'foreign key'),
    ('0007_time_entries.sql', 'constraint', 'public.projects : projects_pkey', 'primary key'),
    ('0007_time_entries.sql', 'constraint', 'public.time_entries : time_entries_client_id_fkey', 'foreign key'),
    ('0007_time_entries.sql', 'constraint', 'public.time_entries : time_entries_contract_id_fkey', 'foreign key'),
    ('0007_time_entries.sql', 'constraint', 'public.time_entries : time_entries_created_by_fkey', 'foreign key'),
    ('0007_time_entries.sql', 'constraint', 'public.time_entries : time_entries_hours_check', 'check'),
    ('0007_time_entries.sql', 'constraint', 'public.time_entries : time_entries_org_id_fkey', 'foreign key'),
    ('0007_time_entries.sql', 'constraint', 'public.time_entries : time_entries_pkey', 'primary key'),
    ('0007_time_entries.sql', 'constraint', 'public.time_entries : time_entries_project_id_fkey', 'foreign key'),
    ('0007_time_entries.sql', 'index', 'public.projects_client_id_idx', ''),
    ('0007_time_entries.sql', 'index', 'public.projects_org_id_project_code_idx', ''),
    ('0007_time_entries.sql', 'index', 'public.projects_pkey', ''),
    ('0007_time_entries.sql', 'index', 'public.time_entries_client_id_idx', ''),
    ('0007_time_entries.sql', 'index', 'public.time_entries_contract_id_idx', ''),
    ('0007_time_entries.sql', 'index', 'public.time_entries_org_id_idx', ''),
    ('0007_time_entries.sql', 'index', 'public.time_entries_pkey', ''),
    ('0007_time_entries.sql', 'index', 'public.time_entries_project_id_idx', ''),
    ('0007_time_entries.sql', 'policy', 'public.projects : org members can manage projects', 'ALL'),
    ('0007_time_entries.sql', 'policy', 'public.time_entries : org members can manage time entries', 'ALL'),
    ('0007_time_entries.sql', 'rls', 'public.projects', 'enabled'),
    ('0007_time_entries.sql', 'rls', 'public.time_entries', 'enabled'),
    ('0007_time_entries.sql', 'table', 'public.projects', ''),
    ('0007_time_entries.sql', 'table', 'public.time_entries', ''),
    ('0008_timecard_approvals.sql', 'column', 'public.time_entries.timecard_id', 'uuid'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.approval_token', 'uuid'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.approver_email', 'text'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.approver_name', 'text'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.client_approved_at', 'timestamp with time zone'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.client_approved_by_name', 'text'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.client_id', 'uuid'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.client_rejected_at', 'timestamp with time zone'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.created_at', 'timestamp with time zone'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.created_by', 'uuid'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.id', 'uuid'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.internal_approval_id', 'text'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.internal_approved_at', 'timestamp with time zone'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.internal_approved_by', 'uuid'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.org_id', 'uuid'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.period_end', 'date'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.period_start', 'date'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.rejection_reason', 'text'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.sent_at', 'timestamp with time zone'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.status', 'timecard_status'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.total_amount', 'numeric(12,2)'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.total_hours', 'numeric(8,2)'),
    ('0008_timecard_approvals.sql', 'column', 'public.timecards.updated_at', 'timestamp with time zone'),
    ('0008_timecard_approvals.sql', 'column default', 'public.timecards.approval_token', 'gen_random_uuid()'),
    ('0008_timecard_approvals.sql', 'column default', 'public.timecards.created_at', 'now()'),
    ('0008_timecard_approvals.sql', 'column default', 'public.timecards.id', 'gen_random_uuid()'),
    ('0008_timecard_approvals.sql', 'column default', 'public.timecards.status', '''draft''::timecard_status'),
    ('0008_timecard_approvals.sql', 'column default', 'public.timecards.total_hours', '0'),
    ('0008_timecard_approvals.sql', 'column default', 'public.timecards.updated_at', 'now()'),
    ('0008_timecard_approvals.sql', 'constraint', 'public.time_entries : time_entries_timecard_id_fkey', 'foreign key'),
    ('0008_timecard_approvals.sql', 'constraint', 'public.timecards : timecards_client_id_fkey', 'foreign key'),
    ('0008_timecard_approvals.sql', 'constraint', 'public.timecards : timecards_created_by_fkey', 'foreign key'),
    ('0008_timecard_approvals.sql', 'constraint', 'public.timecards : timecards_internal_approved_by_fkey', 'foreign key'),
    ('0008_timecard_approvals.sql', 'constraint', 'public.timecards : timecards_org_id_fkey', 'foreign key'),
    ('0008_timecard_approvals.sql', 'constraint', 'public.timecards : timecards_pkey', 'primary key'),
    ('0008_timecard_approvals.sql', 'enum', 'public.timecard_status', ''),
    ('0008_timecard_approvals.sql', 'enum value', 'public.timecard_status.client_approved', ''),
    ('0008_timecard_approvals.sql', 'enum value', 'public.timecard_status.client_rejected', ''),
    ('0008_timecard_approvals.sql', 'enum value', 'public.timecard_status.draft', ''),
    ('0008_timecard_approvals.sql', 'enum value', 'public.timecard_status.internally_approved', ''),
    ('0008_timecard_approvals.sql', 'enum value', 'public.timecard_status.sent', ''),
    ('0008_timecard_approvals.sql', 'index', 'public.time_entries_timecard_id_idx', ''),
    ('0008_timecard_approvals.sql', 'index', 'public.timecards_approval_token_idx', ''),
    ('0008_timecard_approvals.sql', 'index', 'public.timecards_client_id_idx', ''),
    ('0008_timecard_approvals.sql', 'index', 'public.timecards_pkey', ''),
    ('0008_timecard_approvals.sql', 'policy', 'public.timecards : org members can manage timecards', 'ALL'),
    ('0008_timecard_approvals.sql', 'rls', 'public.timecards', 'enabled'),
    ('0008_timecard_approvals.sql', 'table', 'public.timecards', ''),
    ('0009_docs.sql', 'column', 'public.docs.body', 'text'),
    ('0009_docs.sql', 'column', 'public.docs.created_at', 'timestamp with time zone'),
    ('0009_docs.sql', 'column', 'public.docs.created_by', 'uuid'),
    ('0009_docs.sql', 'column', 'public.docs.id', 'uuid'),
    ('0009_docs.sql', 'column', 'public.docs.org_id', 'uuid'),
    ('0009_docs.sql', 'column', 'public.docs.slug', 'text'),
    ('0009_docs.sql', 'column', 'public.docs.title', 'text'),
    ('0009_docs.sql', 'column', 'public.docs.updated_at', 'timestamp with time zone'),
    ('0009_docs.sql', 'column default', 'public.docs.body', '''''::text'),
    ('0009_docs.sql', 'column default', 'public.docs.created_at', 'now()'),
    ('0009_docs.sql', 'column default', 'public.docs.id', 'gen_random_uuid()'),
    ('0009_docs.sql', 'column default', 'public.docs.updated_at', 'now()'),
    ('0009_docs.sql', 'constraint', 'public.docs : docs_created_by_fkey', 'foreign key'),
    ('0009_docs.sql', 'constraint', 'public.docs : docs_org_id_fkey', 'foreign key'),
    ('0009_docs.sql', 'constraint', 'public.docs : docs_pkey', 'primary key'),
    ('0009_docs.sql', 'index', 'public.docs_org_id_idx', ''),
    ('0009_docs.sql', 'index', 'public.docs_org_id_slug_idx', ''),
    ('0009_docs.sql', 'index', 'public.docs_pkey', ''),
    ('0009_docs.sql', 'policy', 'public.docs : org members can manage docs', 'ALL'),
    ('0009_docs.sql', 'rls', 'public.docs', 'enabled'),
    ('0009_docs.sql', 'table', 'public.docs', ''),
    ('0010_invoices.sql', 'column', 'public.invoice_line_items.amount', 'numeric(12,2)'),
    ('0010_invoices.sql', 'column', 'public.invoice_line_items.created_at', 'timestamp with time zone'),
    ('0010_invoices.sql', 'column', 'public.invoice_line_items.description', 'text'),
    ('0010_invoices.sql', 'column', 'public.invoice_line_items.id', 'uuid'),
    ('0010_invoices.sql', 'column', 'public.invoice_line_items.invoice_id', 'uuid'),
    ('0010_invoices.sql', 'column', 'public.invoice_line_items.org_id', 'uuid'),
    ('0010_invoices.sql', 'column', 'public.invoice_line_items.quantity', 'numeric(10,2)'),
    ('0010_invoices.sql', 'column', 'public.invoice_line_items.sort_order', 'integer'),
    ('0010_invoices.sql', 'column', 'public.invoice_line_items.unit_price', 'numeric(12,2)'),
    ('0010_invoices.sql', 'column', 'public.invoices.billing_contact_email', 'text'),
    ('0010_invoices.sql', 'column', 'public.invoices.billing_contact_name', 'text'),
    ('0010_invoices.sql', 'column', 'public.invoices.client_id', 'uuid'),
    ('0010_invoices.sql', 'column', 'public.invoices.contract_id', 'uuid'),
    ('0010_invoices.sql', 'column', 'public.invoices.created_at', 'timestamp with time zone'),
    ('0010_invoices.sql', 'column', 'public.invoices.created_by', 'uuid'),
    ('0010_invoices.sql', 'column', 'public.invoices.due_date', 'date'),
    ('0010_invoices.sql', 'column', 'public.invoices.id', 'uuid'),
    ('0010_invoices.sql', 'column', 'public.invoices.invoice_number', 'text'),
    ('0010_invoices.sql', 'column', 'public.invoices.issue_date', 'date'),
    ('0010_invoices.sql', 'column', 'public.invoices.notes', 'text'),
    ('0010_invoices.sql', 'column', 'public.invoices.org_id', 'uuid'),
    ('0010_invoices.sql', 'column', 'public.invoices.paid_at', 'timestamp with time zone'),
    ('0010_invoices.sql', 'column', 'public.invoices.sent_at', 'timestamp with time zone'),
    ('0010_invoices.sql', 'column', 'public.invoices.status', 'invoice_status'),
    ('0010_invoices.sql', 'column', 'public.invoices.subtotal', 'numeric(12,2)'),
    ('0010_invoices.sql', 'column', 'public.invoices.tax_amount', 'numeric(12,2)'),
    ('0010_invoices.sql', 'column', 'public.invoices.tax_rate', 'numeric(5,2)'),
    ('0010_invoices.sql', 'column', 'public.invoices.timecard_id', 'uuid'),
    ('0010_invoices.sql', 'column', 'public.invoices.total', 'numeric(12,2)'),
    ('0010_invoices.sql', 'column', 'public.invoices.updated_at', 'timestamp with time zone'),
    ('0010_invoices.sql', 'column default', 'public.invoice_line_items.amount', '0'),
    ('0010_invoices.sql', 'column default', 'public.invoice_line_items.created_at', 'now()'),
    ('0010_invoices.sql', 'column default', 'public.invoice_line_items.id', 'gen_random_uuid()'),
    ('0010_invoices.sql', 'column default', 'public.invoice_line_items.quantity', '1'),
    ('0010_invoices.sql', 'column default', 'public.invoice_line_items.sort_order', '0'),
    ('0010_invoices.sql', 'column default', 'public.invoice_line_items.unit_price', '0'),
    ('0010_invoices.sql', 'column default', 'public.invoices.created_at', 'now()'),
    ('0010_invoices.sql', 'column default', 'public.invoices.id', 'gen_random_uuid()'),
    ('0010_invoices.sql', 'column default', 'public.invoices.issue_date', 'CURRENT_DATE'),
    ('0010_invoices.sql', 'column default', 'public.invoices.status', '''draft''::invoice_status'),
    ('0010_invoices.sql', 'column default', 'public.invoices.subtotal', '0'),
    ('0010_invoices.sql', 'column default', 'public.invoices.tax_amount', '0'),
    ('0010_invoices.sql', 'column default', 'public.invoices.tax_rate', '0'),
    ('0010_invoices.sql', 'column default', 'public.invoices.total', '0'),
    ('0010_invoices.sql', 'column default', 'public.invoices.updated_at', 'now()'),
    ('0010_invoices.sql', 'constraint', 'public.invoice_line_items : invoice_line_items_invoice_id_fkey', 'foreign key'),
    ('0010_invoices.sql', 'constraint', 'public.invoice_line_items : invoice_line_items_org_id_fkey', 'foreign key'),
    ('0010_invoices.sql', 'constraint', 'public.invoice_line_items : invoice_line_items_pkey', 'primary key'),
    ('0010_invoices.sql', 'constraint', 'public.invoices : invoices_client_id_fkey', 'foreign key'),
    ('0010_invoices.sql', 'constraint', 'public.invoices : invoices_contract_id_fkey', 'foreign key'),
    ('0010_invoices.sql', 'constraint', 'public.invoices : invoices_created_by_fkey', 'foreign key'),
    ('0010_invoices.sql', 'constraint', 'public.invoices : invoices_org_id_fkey', 'foreign key'),
    ('0010_invoices.sql', 'constraint', 'public.invoices : invoices_pkey', 'primary key'),
    ('0010_invoices.sql', 'constraint', 'public.invoices : invoices_timecard_id_fkey', 'foreign key'),
    ('0010_invoices.sql', 'enum', 'public.invoice_status', ''),
    ('0010_invoices.sql', 'enum value', 'public.invoice_status.draft', ''),
    ('0010_invoices.sql', 'enum value', 'public.invoice_status.overdue', ''),
    ('0010_invoices.sql', 'enum value', 'public.invoice_status.paid', ''),
    ('0010_invoices.sql', 'enum value', 'public.invoice_status.sent', ''),
    ('0010_invoices.sql', 'enum value', 'public.invoice_status.void', ''),
    ('0010_invoices.sql', 'index', 'public.invoice_line_items_invoice_id_idx', ''),
    ('0010_invoices.sql', 'index', 'public.invoice_line_items_pkey', ''),
    ('0010_invoices.sql', 'index', 'public.invoices_client_id_idx', ''),
    ('0010_invoices.sql', 'index', 'public.invoices_contract_id_idx', ''),
    ('0010_invoices.sql', 'index', 'public.invoices_org_id_invoice_number_idx', ''),
    ('0010_invoices.sql', 'index', 'public.invoices_pkey', ''),
    ('0010_invoices.sql', 'index', 'public.invoices_timecard_id_idx', ''),
    ('0010_invoices.sql', 'policy', 'public.invoice_line_items : org members can manage invoice line items', 'ALL'),
    ('0010_invoices.sql', 'policy', 'public.invoices : org members can manage invoices', 'ALL'),
    ('0010_invoices.sql', 'rls', 'public.invoice_line_items', 'enabled'),
    ('0010_invoices.sql', 'rls', 'public.invoices', 'enabled'),
    ('0010_invoices.sql', 'table', 'public.invoice_line_items', ''),
    ('0010_invoices.sql', 'table', 'public.invoices', ''),
    ('0010_tax_filing_connector.sql', 'enum value', 'public.data_source_type.tax_filing', ''),
    ('0011_signup_approval.sql', 'column', 'public.org_invites.accepted_at', 'timestamp with time zone'),
    ('0011_signup_approval.sql', 'column', 'public.org_invites.created_at', 'timestamp with time zone'),
    ('0011_signup_approval.sql', 'column', 'public.org_invites.email', 'text'),
    ('0011_signup_approval.sql', 'column', 'public.org_invites.expires_at', 'timestamp with time zone'),
    ('0011_signup_approval.sql', 'column', 'public.org_invites.id', 'uuid'),
    ('0011_signup_approval.sql', 'column', 'public.org_invites.invited_by', 'uuid'),
    ('0011_signup_approval.sql', 'column', 'public.org_invites.org_id', 'uuid'),
    ('0011_signup_approval.sql', 'column', 'public.org_invites.role', 'org_role'),
    ('0011_signup_approval.sql', 'column', 'public.org_invites.token', 'uuid'),
    ('0011_signup_approval.sql', 'column', 'public.signup_requests.company_name', 'text'),
    ('0011_signup_approval.sql', 'column', 'public.signup_requests.created_at', 'timestamp with time zone'),
    ('0011_signup_approval.sql', 'column', 'public.signup_requests.decided_at', 'timestamp with time zone'),
    ('0011_signup_approval.sql', 'column', 'public.signup_requests.decided_by', 'uuid'),
    ('0011_signup_approval.sql', 'column', 'public.signup_requests.decision_org_id', 'uuid'),
    ('0011_signup_approval.sql', 'column', 'public.signup_requests.decision_role', 'org_role'),
    ('0011_signup_approval.sql', 'column', 'public.signup_requests.email', 'text'),
    ('0011_signup_approval.sql', 'column', 'public.signup_requests.full_name', 'text'),
    ('0011_signup_approval.sql', 'column', 'public.signup_requests.id', 'uuid'),
    ('0011_signup_approval.sql', 'column', 'public.signup_requests.status', 'signup_request_status'),
    ('0011_signup_approval.sql', 'column', 'public.signup_requests.user_id', 'uuid'),
    ('0011_signup_approval.sql', 'column default', 'public.org_invites.created_at', 'now()'),
    ('0011_signup_approval.sql', 'column default', 'public.org_invites.expires_at', '(now() + ''14 days''::interval)'),
    ('0011_signup_approval.sql', 'column default', 'public.org_invites.id', 'gen_random_uuid()'),
    ('0011_signup_approval.sql', 'column default', 'public.org_invites.role', '''member''::org_role'),
    ('0011_signup_approval.sql', 'column default', 'public.org_invites.token', 'gen_random_uuid()'),
    ('0011_signup_approval.sql', 'column default', 'public.signup_requests.created_at', 'now()'),
    ('0011_signup_approval.sql', 'column default', 'public.signup_requests.id', 'gen_random_uuid()'),
    ('0011_signup_approval.sql', 'column default', 'public.signup_requests.status', '''pending''::signup_request_status'),
    ('0011_signup_approval.sql', 'constraint', 'public.org_invites : org_invites_invited_by_fkey', 'foreign key'),
    ('0011_signup_approval.sql', 'constraint', 'public.org_invites : org_invites_org_id_fkey', 'foreign key'),
    ('0011_signup_approval.sql', 'constraint', 'public.org_invites : org_invites_pkey', 'primary key'),
    ('0011_signup_approval.sql', 'constraint', 'public.signup_requests : signup_requests_decided_by_fkey', 'foreign key'),
    ('0011_signup_approval.sql', 'constraint', 'public.signup_requests : signup_requests_decision_org_id_fkey', 'foreign key'),
    ('0011_signup_approval.sql', 'constraint', 'public.signup_requests : signup_requests_pkey', 'primary key'),
    ('0011_signup_approval.sql', 'constraint', 'public.signup_requests : signup_requests_user_id_fkey', 'foreign key'),
    ('0011_signup_approval.sql', 'constraint', 'public.signup_requests : signup_requests_user_id_key', 'unique'),
    ('0011_signup_approval.sql', 'enum', 'public.signup_request_status', ''),
    ('0011_signup_approval.sql', 'enum value', 'public.signup_request_status.approved', ''),
    ('0011_signup_approval.sql', 'enum value', 'public.signup_request_status.pending', ''),
    ('0011_signup_approval.sql', 'enum value', 'public.signup_request_status.rejected', ''),
    ('0011_signup_approval.sql', 'function', 'public.is_any_org_admin()', ''),
    ('0011_signup_approval.sql', 'function body', 'public.is_any_org_admin()', 'c6e565214d8327521cfcd2ea42ba4437'),
    ('0011_signup_approval.sql', 'index', 'public.org_invites_org_id_idx', ''),
    ('0011_signup_approval.sql', 'index', 'public.org_invites_pkey', ''),
    ('0011_signup_approval.sql', 'index', 'public.org_invites_token_idx', ''),
    ('0011_signup_approval.sql', 'index', 'public.signup_requests_pkey', ''),
    ('0011_signup_approval.sql', 'index', 'public.signup_requests_status_idx', ''),
    ('0011_signup_approval.sql', 'index', 'public.signup_requests_user_id_key', ''),
    ('0011_signup_approval.sql', 'policy', 'public.org_invites : org admins can manage invites', 'ALL'),
    ('0011_signup_approval.sql', 'policy', 'public.signup_requests : org admins can decide signup requests', 'UPDATE'),
    ('0011_signup_approval.sql', 'policy', 'public.signup_requests : org admins can view signup requests', 'SELECT'),
    ('0011_signup_approval.sql', 'rls', 'public.org_invites', 'enabled'),
    ('0011_signup_approval.sql', 'rls', 'public.signup_requests', 'enabled'),
    ('0011_signup_approval.sql', 'table', 'public.org_invites', ''),
    ('0011_signup_approval.sql', 'table', 'public.signup_requests', ''),
    ('0012_docs_categories.sql', 'column', 'public.docs.category', 'text'),
    ('0012_docs_categories.sql', 'column default', 'public.docs.category', '''General''::text'),
    ('0012_docs_categories.sql', 'index', 'public.docs_org_id_category_idx', ''),
    ('0013_client_portal.sql', 'column', 'public.client_portal_invites.accepted_at', 'timestamp with time zone'),
    ('0013_client_portal.sql', 'column', 'public.client_portal_invites.client_id', 'uuid'),
    ('0013_client_portal.sql', 'column', 'public.client_portal_invites.created_at', 'timestamp with time zone'),
    ('0013_client_portal.sql', 'column', 'public.client_portal_invites.email', 'text'),
    ('0013_client_portal.sql', 'column', 'public.client_portal_invites.expires_at', 'timestamp with time zone'),
    ('0013_client_portal.sql', 'column', 'public.client_portal_invites.id', 'uuid'),
    ('0013_client_portal.sql', 'column', 'public.client_portal_invites.invited_by', 'uuid'),
    ('0013_client_portal.sql', 'column', 'public.client_portal_invites.org_id', 'uuid'),
    ('0013_client_portal.sql', 'column', 'public.client_portal_invites.token', 'uuid'),
    ('0013_client_portal.sql', 'column', 'public.client_portal_users.client_id', 'uuid'),
    ('0013_client_portal.sql', 'column', 'public.client_portal_users.created_at', 'timestamp with time zone'),
    ('0013_client_portal.sql', 'column', 'public.client_portal_users.email', 'text'),
    ('0013_client_portal.sql', 'column', 'public.client_portal_users.id', 'uuid'),
    ('0013_client_portal.sql', 'column', 'public.client_portal_users.org_id', 'uuid'),
    ('0013_client_portal.sql', 'column default', 'public.client_portal_invites.created_at', 'now()'),
    ('0013_client_portal.sql', 'column default', 'public.client_portal_invites.expires_at', '(now() + ''14 days''::interval)'),
    ('0013_client_portal.sql', 'column default', 'public.client_portal_invites.id', 'gen_random_uuid()'),
    ('0013_client_portal.sql', 'column default', 'public.client_portal_invites.token', 'gen_random_uuid()'),
    ('0013_client_portal.sql', 'column default', 'public.client_portal_users.created_at', 'now()'),
    ('0013_client_portal.sql', 'column default', 'public.projects.status', '''intake''::text'),
    ('0013_client_portal.sql', 'constraint', 'public.client_portal_invites : client_portal_invites_client_id_fkey', 'foreign key'),
    ('0013_client_portal.sql', 'constraint', 'public.client_portal_invites : client_portal_invites_invited_by_fkey', 'foreign key'),
    ('0013_client_portal.sql', 'constraint', 'public.client_portal_invites : client_portal_invites_org_id_fkey', 'foreign key'),
    ('0013_client_portal.sql', 'constraint', 'public.client_portal_invites : client_portal_invites_pkey', 'primary key'),
    ('0013_client_portal.sql', 'constraint', 'public.client_portal_users : client_portal_users_client_id_fkey', 'foreign key'),
    ('0013_client_portal.sql', 'constraint', 'public.client_portal_users : client_portal_users_id_fkey', 'foreign key'),
    ('0013_client_portal.sql', 'constraint', 'public.client_portal_users : client_portal_users_org_id_fkey', 'foreign key'),
    ('0013_client_portal.sql', 'constraint', 'public.client_portal_users : client_portal_users_pkey', 'primary key'),
    ('0013_client_portal.sql', 'constraint', 'public.projects : projects_status_check', 'check'),
    ('0013_client_portal.sql', 'function', 'public.is_client_portal_user(check_client_id uuid)', ''),
    ('0013_client_portal.sql', 'function body', 'public.is_client_portal_user(check_client_id uuid)', 'a5b8289047d5ed5818eb5263f4d94333'),
    ('0013_client_portal.sql', 'index', 'public.client_portal_invites_client_id_idx', ''),
    ('0013_client_portal.sql', 'index', 'public.client_portal_invites_pkey', ''),
    ('0013_client_portal.sql', 'index', 'public.client_portal_invites_token_idx', ''),
    ('0013_client_portal.sql', 'index', 'public.client_portal_users_client_id_idx', ''),
    ('0013_client_portal.sql', 'index', 'public.client_portal_users_org_id_idx', ''),
    ('0013_client_portal.sql', 'index', 'public.client_portal_users_pkey', ''),
    ('0013_client_portal.sql', 'policy', 'public.client_contracts : client users can view their contracts', 'SELECT'),
    ('0013_client_portal.sql', 'policy', 'public.client_portal_invites : org admins can manage client portal invites', 'ALL'),
    ('0013_client_portal.sql', 'policy', 'public.client_portal_users : client users can view their own membership', 'SELECT'),
    ('0013_client_portal.sql', 'policy', 'public.client_portal_users : org admins can manage client portal users', 'ALL'),
    ('0013_client_portal.sql', 'policy', 'public.clients : client users can view their own client record', 'SELECT'),
    ('0013_client_portal.sql', 'policy', 'public.data_sources : client users can view their data sources', 'SELECT'),
    ('0013_client_portal.sql', 'policy', 'public.invoice_line_items : client users can view their invoice line items', 'SELECT'),
    ('0013_client_portal.sql', 'policy', 'public.invoices : client users can view their invoices', 'SELECT'),
    ('0013_client_portal.sql', 'policy', 'public.pipeline_runs : client users can view their pipeline runs', 'SELECT'),
    ('0013_client_portal.sql', 'policy', 'public.pipelines : client users can view their pipelines', 'SELECT'),
    ('0013_client_portal.sql', 'policy', 'public.projects : client users can view their projects', 'SELECT'),
    ('0013_client_portal.sql', 'policy', 'public.time_entries : client users can view their time entries', 'SELECT'),
    ('0013_client_portal.sql', 'policy', 'public.timecards : client users can view their timecards', 'SELECT'),
    ('0013_client_portal.sql', 'realtime', 'public.data_sources', ''),
    ('0013_client_portal.sql', 'realtime', 'public.pipeline_runs', ''),
    ('0013_client_portal.sql', 'realtime', 'public.projects', ''),
    ('0013_client_portal.sql', 'rls', 'public.client_portal_invites', 'enabled'),
    ('0013_client_portal.sql', 'rls', 'public.client_portal_users', 'enabled'),
    ('0013_client_portal.sql', 'table', 'public.client_portal_invites', ''),
    ('0013_client_portal.sql', 'table', 'public.client_portal_users', ''),
    ('0013_doc_categories.sql', 'column', 'public.doc_categories.created_at', 'timestamp with time zone'),
    ('0013_doc_categories.sql', 'column', 'public.doc_categories.created_by', 'uuid'),
    ('0013_doc_categories.sql', 'column', 'public.doc_categories.id', 'uuid'),
    ('0013_doc_categories.sql', 'column', 'public.doc_categories.name', 'text'),
    ('0013_doc_categories.sql', 'column', 'public.doc_categories.org_id', 'uuid'),
    ('0013_doc_categories.sql', 'column default', 'public.doc_categories.created_at', 'now()'),
    ('0013_doc_categories.sql', 'column default', 'public.doc_categories.id', 'gen_random_uuid()'),
    ('0013_doc_categories.sql', 'constraint', 'public.doc_categories : doc_categories_created_by_fkey', 'foreign key'),
    ('0013_doc_categories.sql', 'constraint', 'public.doc_categories : doc_categories_org_id_fkey', 'foreign key'),
    ('0013_doc_categories.sql', 'constraint', 'public.doc_categories : doc_categories_pkey', 'primary key'),
    ('0013_doc_categories.sql', 'index', 'public.doc_categories_org_id_idx', ''),
    ('0013_doc_categories.sql', 'index', 'public.doc_categories_org_id_name_idx', ''),
    ('0013_doc_categories.sql', 'index', 'public.doc_categories_pkey', ''),
    ('0013_doc_categories.sql', 'policy', 'public.doc_categories : org members can manage doc categories', 'ALL'),
    ('0013_doc_categories.sql', 'rls', 'public.doc_categories', 'enabled'),
    ('0013_doc_categories.sql', 'table', 'public.doc_categories', ''),
    ('0014_traceable_ids.sql', 'column', 'public.client_contracts.contract_number', 'text'),
    ('0014_traceable_ids.sql', 'column', 'public.pipeline_runs.run_number', 'text'),
    ('0014_traceable_ids.sql', 'column', 'public.timecards.timecard_number', 'text'),
    ('0014_traceable_ids.sql', 'column default', 'public.client_contracts.contract_number', '(''CTR-''::text || upper(substr((gen_random_uuid())::text, 1, 8)))'),
    ('0014_traceable_ids.sql', 'column default', 'public.pipeline_runs.run_number', '(''RUN-''::text || upper(substr((gen_random_uuid())::text, 1, 8)))'),
    ('0014_traceable_ids.sql', 'column default', 'public.timecards.timecard_number', '(''TC-''::text || upper(substr((gen_random_uuid())::text, 1, 8)))'),
    ('0014_traceable_ids.sql', 'index', 'public.client_contracts_contract_number_idx', ''),
    ('0014_traceable_ids.sql', 'index', 'public.pipeline_runs_run_number_idx', ''),
    ('0014_traceable_ids.sql', 'index', 'public.timecards_timecard_number_idx', ''),
    ('0015_password_expiry.sql', 'column', 'public.client_portal_users.password_updated_at', 'timestamp with time zone'),
    ('0015_password_expiry.sql', 'column', 'public.profiles.password_updated_at', 'timestamp with time zone'),
    ('0015_password_expiry.sql', 'column default', 'public.client_portal_users.password_updated_at', 'now()'),
    ('0015_password_expiry.sql', 'column default', 'public.profiles.password_updated_at', 'now()'),
    ('0016_project_manager.sql', 'column', 'public.clients.project_manager_id', 'uuid'),
    ('0016_project_manager.sql', 'constraint', 'public.clients : clients_project_manager_id_fkey', 'foreign key'),
    ('0016_project_manager.sql', 'index', 'public.clients_project_manager_id_idx', ''),
    ('0016_project_manager.sql', 'policy', 'public.profiles : client portal users can view their assigned PM profile', 'SELECT'),
    ('0016_project_manager.sql', 'policy', 'public.profiles : org members can view org-mates profiles', 'SELECT'),
    ('0017_adp_paychex_connectors.sql', 'enum value', 'public.data_source_type.adp_workforce_now', ''),
    ('0017_adp_paychex_connectors.sql', 'enum value', 'public.data_source_type.paychex_flex', ''),
    ('0018_pipeline_preview_and_rollback.sql', 'column', 'public.pipeline_runs.loaded_records', 'jsonb'),
    ('0018_pipeline_preview_and_rollback.sql', 'column', 'public.pipeline_runs.rolled_back_at', 'timestamp with time zone'),
    ('0018_pipeline_preview_and_rollback.sql', 'column', 'public.pipeline_runs.rolled_back_by', 'uuid'),
    ('0018_pipeline_preview_and_rollback.sql', 'column', 'public.pipeline_runs.sample_records', 'jsonb'),
    ('0018_pipeline_preview_and_rollback.sql', 'column default', 'public.pipeline_runs.loaded_records', '''[]''::jsonb'),
    ('0018_pipeline_preview_and_rollback.sql', 'column default', 'public.pipeline_runs.sample_records', '''[]''::jsonb'),
    ('0018_pipeline_preview_and_rollback.sql', 'constraint', 'public.pipeline_runs : pipeline_runs_rolled_back_by_fkey', 'foreign key'),
    ('0018_pipeline_preview_and_rollback.sql', 'policy', 'public.pipeline_runs : org members can update pipeline runs', 'UPDATE'),
    ('0019_blog_posts.sql', 'column', 'public.blog_posts.author_name', 'text'),
    ('0019_blog_posts.sql', 'column', 'public.blog_posts.body', 'text'),
    ('0019_blog_posts.sql', 'column', 'public.blog_posts.category', 'text'),
    ('0019_blog_posts.sql', 'column', 'public.blog_posts.created_at', 'timestamp with time zone'),
    ('0019_blog_posts.sql', 'column', 'public.blog_posts.created_by', 'uuid'),
    ('0019_blog_posts.sql', 'column', 'public.blog_posts.excerpt', 'text'),
    ('0019_blog_posts.sql', 'column', 'public.blog_posts.id', 'uuid'),
    ('0019_blog_posts.sql', 'column', 'public.blog_posts.org_id', 'uuid'),
    ('0019_blog_posts.sql', 'column', 'public.blog_posts.published', 'boolean'),
    ('0019_blog_posts.sql', 'column', 'public.blog_posts.published_at', 'timestamp with time zone'),
    ('0019_blog_posts.sql', 'column', 'public.blog_posts.slug', 'text'),
    ('0019_blog_posts.sql', 'column', 'public.blog_posts.title', 'text'),
    ('0019_blog_posts.sql', 'column', 'public.blog_posts.updated_at', 'timestamp with time zone'),
    ('0019_blog_posts.sql', 'column default', 'public.blog_posts.author_name', '''''::text'),
    ('0019_blog_posts.sql', 'column default', 'public.blog_posts.body', '''''::text'),
    ('0019_blog_posts.sql', 'column default', 'public.blog_posts.category', '''General''::text'),
    ('0019_blog_posts.sql', 'column default', 'public.blog_posts.created_at', 'now()'),
    ('0019_blog_posts.sql', 'column default', 'public.blog_posts.excerpt', '''''::text'),
    ('0019_blog_posts.sql', 'column default', 'public.blog_posts.id', 'gen_random_uuid()'),
    ('0019_blog_posts.sql', 'column default', 'public.blog_posts.published', 'false'),
    ('0019_blog_posts.sql', 'column default', 'public.blog_posts.updated_at', 'now()'),
    ('0019_blog_posts.sql', 'constraint', 'public.blog_posts : blog_posts_created_by_fkey', 'foreign key'),
    ('0019_blog_posts.sql', 'constraint', 'public.blog_posts : blog_posts_org_id_fkey', 'foreign key'),
    ('0019_blog_posts.sql', 'constraint', 'public.blog_posts : blog_posts_pkey', 'primary key'),
    ('0019_blog_posts.sql', 'index', 'public.blog_posts_org_id_idx', ''),
    ('0019_blog_posts.sql', 'index', 'public.blog_posts_org_id_slug_idx', ''),
    ('0019_blog_posts.sql', 'index', 'public.blog_posts_pkey', ''),
    ('0019_blog_posts.sql', 'index', 'public.blog_posts_published_idx', ''),
    ('0019_blog_posts.sql', 'policy', 'public.blog_posts : org members can manage blog posts', 'ALL'),
    ('0019_blog_posts.sql', 'rls', 'public.blog_posts', 'enabled'),
    ('0019_blog_posts.sql', 'table', 'public.blog_posts', ''),
    ('0020_brief_download_leads.sql', 'column', 'public.brief_download_leads.created_at', 'timestamp with time zone'),
    ('0020_brief_download_leads.sql', 'column', 'public.brief_download_leads.email', 'text'),
    ('0020_brief_download_leads.sql', 'column', 'public.brief_download_leads.id', 'uuid'),
    ('0020_brief_download_leads.sql', 'column', 'public.brief_download_leads.source', 'text'),
    ('0020_brief_download_leads.sql', 'column default', 'public.brief_download_leads.created_at', 'now()'),
    ('0020_brief_download_leads.sql', 'column default', 'public.brief_download_leads.id', 'gen_random_uuid()'),
    ('0020_brief_download_leads.sql', 'column default', 'public.brief_download_leads.source', '''executive-brief''::text'),
    ('0020_brief_download_leads.sql', 'constraint', 'public.brief_download_leads : brief_download_leads_pkey', 'primary key'),
    ('0020_brief_download_leads.sql', 'index', 'public.brief_download_leads_email_idx', ''),
    ('0020_brief_download_leads.sql', 'index', 'public.brief_download_leads_pkey', ''),
    ('0020_brief_download_leads.sql', 'rls', 'public.brief_download_leads', 'enabled'),
    ('0020_brief_download_leads.sql', 'table', 'public.brief_download_leads', ''),
    ('0021_web_scraper_connector.sql', 'enum value', 'public.data_source_type.web_scraper', ''),
    ('0022_workflow_center.sql', 'column', 'public.workflow_definitions.created_at', 'timestamp with time zone'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_definitions.created_by', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_definitions.description', 'text'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_definitions.id', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_definitions.is_active', 'boolean'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_definitions.name', 'text'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_definitions.org_id', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_definitions.updated_at', 'timestamp with time zone'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_instance_events.created_at', 'timestamp with time zone'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_instance_events.created_by', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_instance_events.from_stage_id', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_instance_events.id', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_instance_events.note', 'text'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_instance_events.org_id', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_instance_events.to_stage_id', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_instance_events.workflow_instance_id', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_instances.completed_at', 'timestamp with time zone'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_instances.created_at', 'timestamp with time zone'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_instances.created_by', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_instances.current_stage_id', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_instances.id', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_instances.org_id', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_instances.status', 'workflow_instance_status'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_instances.subject_id', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_instances.subject_type', 'text'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_instances.title', 'text'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_instances.updated_at', 'timestamp with time zone'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_instances.workflow_definition_id', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_stages.created_at', 'timestamp with time zone'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_stages.id', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_stages.name', 'text'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_stages.org_id', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_stages.position', 'integer'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_stages.sla_hours', 'integer'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_stages.workflow_definition_id', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_tasks.assignee_id', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_tasks.completed_at', 'timestamp with time zone'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_tasks.created_at', 'timestamp with time zone'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_tasks.created_by', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_tasks.description', 'text'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_tasks.due_at', 'timestamp with time zone'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_tasks.id', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_tasks.org_id', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_tasks.stage_id', 'uuid'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_tasks.status', 'workflow_task_status'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_tasks.title', 'text'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_tasks.updated_at', 'timestamp with time zone'),
    ('0022_workflow_center.sql', 'column', 'public.workflow_tasks.workflow_instance_id', 'uuid'),
    ('0022_workflow_center.sql', 'column default', 'public.workflow_definitions.created_at', 'now()'),
    ('0022_workflow_center.sql', 'column default', 'public.workflow_definitions.id', 'gen_random_uuid()'),
    ('0022_workflow_center.sql', 'column default', 'public.workflow_definitions.is_active', 'true'),
    ('0022_workflow_center.sql', 'column default', 'public.workflow_definitions.updated_at', 'now()'),
    ('0022_workflow_center.sql', 'column default', 'public.workflow_instance_events.created_at', 'now()'),
    ('0022_workflow_center.sql', 'column default', 'public.workflow_instance_events.id', 'gen_random_uuid()'),
    ('0022_workflow_center.sql', 'column default', 'public.workflow_instances.created_at', 'now()'),
    ('0022_workflow_center.sql', 'column default', 'public.workflow_instances.id', 'gen_random_uuid()'),
    ('0022_workflow_center.sql', 'column default', 'public.workflow_instances.status', '''active''::workflow_instance_status'),
    ('0022_workflow_center.sql', 'column default', 'public.workflow_instances.updated_at', 'now()'),
    ('0022_workflow_center.sql', 'column default', 'public.workflow_stages.created_at', 'now()'),
    ('0022_workflow_center.sql', 'column default', 'public.workflow_stages.id', 'gen_random_uuid()'),
    ('0022_workflow_center.sql', 'column default', 'public.workflow_tasks.created_at', 'now()'),
    ('0022_workflow_center.sql', 'column default', 'public.workflow_tasks.id', 'gen_random_uuid()'),
    ('0022_workflow_center.sql', 'column default', 'public.workflow_tasks.status', '''pending''::workflow_task_status'),
    ('0022_workflow_center.sql', 'column default', 'public.workflow_tasks.updated_at', 'now()'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_definitions : workflow_definitions_created_by_fkey', 'foreign key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_definitions : workflow_definitions_org_id_fkey', 'foreign key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_definitions : workflow_definitions_pkey', 'primary key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_instance_events : workflow_instance_events_created_by_fkey', 'foreign key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_instance_events : workflow_instance_events_from_stage_id_fkey', 'foreign key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_instance_events : workflow_instance_events_org_id_fkey', 'foreign key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_instance_events : workflow_instance_events_pkey', 'primary key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_instance_events : workflow_instance_events_to_stage_id_fkey', 'foreign key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_instance_events : workflow_instance_events_workflow_instance_id_fkey', 'foreign key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_instances : workflow_instances_created_by_fkey', 'foreign key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_instances : workflow_instances_current_stage_id_fkey', 'foreign key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_instances : workflow_instances_org_id_fkey', 'foreign key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_instances : workflow_instances_pkey', 'primary key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_instances : workflow_instances_workflow_definition_id_fkey', 'foreign key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_stages : workflow_stages_org_id_fkey', 'foreign key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_stages : workflow_stages_pkey', 'primary key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_stages : workflow_stages_workflow_definition_id_fkey', 'foreign key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_tasks : workflow_tasks_assignee_id_fkey', 'foreign key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_tasks : workflow_tasks_created_by_fkey', 'foreign key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_tasks : workflow_tasks_org_id_fkey', 'foreign key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_tasks : workflow_tasks_pkey', 'primary key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_tasks : workflow_tasks_stage_id_fkey', 'foreign key'),
    ('0022_workflow_center.sql', 'constraint', 'public.workflow_tasks : workflow_tasks_workflow_instance_id_fkey', 'foreign key'),
    ('0022_workflow_center.sql', 'enum', 'public.workflow_instance_status', ''),
    ('0022_workflow_center.sql', 'enum', 'public.workflow_task_status', ''),
    ('0022_workflow_center.sql', 'enum value', 'public.workflow_instance_status.active', ''),
    ('0022_workflow_center.sql', 'enum value', 'public.workflow_instance_status.cancelled', ''),
    ('0022_workflow_center.sql', 'enum value', 'public.workflow_instance_status.completed', ''),
    ('0022_workflow_center.sql', 'enum value', 'public.workflow_task_status.done', ''),
    ('0022_workflow_center.sql', 'enum value', 'public.workflow_task_status.in_progress', ''),
    ('0022_workflow_center.sql', 'enum value', 'public.workflow_task_status.pending', ''),
    ('0022_workflow_center.sql', 'enum value', 'public.workflow_task_status.skipped', ''),
    ('0022_workflow_center.sql', 'index', 'public.workflow_definitions_org_id_idx', ''),
    ('0022_workflow_center.sql', 'index', 'public.workflow_definitions_pkey', ''),
    ('0022_workflow_center.sql', 'index', 'public.workflow_instance_events_instance_id_idx', ''),
    ('0022_workflow_center.sql', 'index', 'public.workflow_instance_events_org_id_idx', ''),
    ('0022_workflow_center.sql', 'index', 'public.workflow_instance_events_pkey', ''),
    ('0022_workflow_center.sql', 'index', 'public.workflow_instances_current_stage_idx', ''),
    ('0022_workflow_center.sql', 'index', 'public.workflow_instances_definition_id_idx', ''),
    ('0022_workflow_center.sql', 'index', 'public.workflow_instances_org_id_idx', ''),
    ('0022_workflow_center.sql', 'index', 'public.workflow_instances_pkey', ''),
    ('0022_workflow_center.sql', 'index', 'public.workflow_instances_status_idx', ''),
    ('0022_workflow_center.sql', 'index', 'public.workflow_stages_definition_id_idx', ''),
    ('0022_workflow_center.sql', 'index', 'public.workflow_stages_definition_position_idx', ''),
    ('0022_workflow_center.sql', 'index', 'public.workflow_stages_org_id_idx', ''),
    ('0022_workflow_center.sql', 'index', 'public.workflow_stages_pkey', ''),
    ('0022_workflow_center.sql', 'index', 'public.workflow_tasks_assignee_idx', ''),
    ('0022_workflow_center.sql', 'index', 'public.workflow_tasks_instance_id_idx', ''),
    ('0022_workflow_center.sql', 'index', 'public.workflow_tasks_org_id_idx', ''),
    ('0022_workflow_center.sql', 'index', 'public.workflow_tasks_pkey', ''),
    ('0022_workflow_center.sql', 'index', 'public.workflow_tasks_status_idx', ''),
    ('0022_workflow_center.sql', 'policy', 'public.workflow_definitions : org members can manage workflow definitions', 'ALL'),
    ('0022_workflow_center.sql', 'policy', 'public.workflow_instance_events : org members can manage workflow instance events', 'ALL'),
    ('0022_workflow_center.sql', 'policy', 'public.workflow_instances : org members can manage workflow instances', 'ALL'),
    ('0022_workflow_center.sql', 'policy', 'public.workflow_stages : org members can manage workflow stages', 'ALL'),
    ('0022_workflow_center.sql', 'policy', 'public.workflow_tasks : org members can manage workflow tasks', 'ALL'),
    ('0022_workflow_center.sql', 'rls', 'public.workflow_definitions', 'enabled'),
    ('0022_workflow_center.sql', 'rls', 'public.workflow_instance_events', 'enabled'),
    ('0022_workflow_center.sql', 'rls', 'public.workflow_instances', 'enabled'),
    ('0022_workflow_center.sql', 'rls', 'public.workflow_stages', 'enabled'),
    ('0022_workflow_center.sql', 'rls', 'public.workflow_tasks', 'enabled'),
    ('0022_workflow_center.sql', 'table', 'public.workflow_definitions', ''),
    ('0022_workflow_center.sql', 'table', 'public.workflow_instance_events', ''),
    ('0022_workflow_center.sql', 'table', 'public.workflow_instances', ''),
    ('0022_workflow_center.sql', 'table', 'public.workflow_stages', ''),
    ('0022_workflow_center.sql', 'table', 'public.workflow_tasks', ''),
    ('0023_jaren_conversations.sql', 'column', 'public.jaren_conversations.created_at', 'timestamp with time zone'),
    ('0023_jaren_conversations.sql', 'column', 'public.jaren_conversations.id', 'uuid'),
    ('0023_jaren_conversations.sql', 'column', 'public.jaren_conversations.org_id', 'uuid'),
    ('0023_jaren_conversations.sql', 'column', 'public.jaren_conversations.status', 'text'),
    ('0023_jaren_conversations.sql', 'column', 'public.jaren_conversations.title', 'text'),
    ('0023_jaren_conversations.sql', 'column', 'public.jaren_conversations.updated_at', 'timestamp with time zone'),
    ('0023_jaren_conversations.sql', 'column', 'public.jaren_conversations.user_id', 'uuid'),
    ('0023_jaren_conversations.sql', 'column', 'public.jaren_messages.content', 'text'),
    ('0023_jaren_conversations.sql', 'column', 'public.jaren_messages.conversation_id', 'uuid'),
    ('0023_jaren_conversations.sql', 'column', 'public.jaren_messages.created_at', 'timestamp with time zone'),
    ('0023_jaren_conversations.sql', 'column', 'public.jaren_messages.id', 'uuid'),
    ('0023_jaren_conversations.sql', 'column', 'public.jaren_messages.role', 'text'),
    ('0023_jaren_conversations.sql', 'column default', 'public.jaren_conversations.created_at', 'now()'),
    ('0023_jaren_conversations.sql', 'column default', 'public.jaren_conversations.id', 'gen_random_uuid()'),
    ('0023_jaren_conversations.sql', 'column default', 'public.jaren_conversations.status', '''active''::text'),
    ('0023_jaren_conversations.sql', 'column default', 'public.jaren_conversations.title', '''New conversation''::text'),
    ('0023_jaren_conversations.sql', 'column default', 'public.jaren_conversations.updated_at', 'now()'),
    ('0023_jaren_conversations.sql', 'column default', 'public.jaren_messages.created_at', 'now()'),
    ('0023_jaren_conversations.sql', 'column default', 'public.jaren_messages.id', 'gen_random_uuid()'),
    ('0023_jaren_conversations.sql', 'constraint', 'public.jaren_conversations : jaren_conversations_org_id_fkey', 'foreign key'),
    ('0023_jaren_conversations.sql', 'constraint', 'public.jaren_conversations : jaren_conversations_pkey', 'primary key'),
    ('0023_jaren_conversations.sql', 'constraint', 'public.jaren_conversations : jaren_conversations_status_check', 'check'),
    ('0023_jaren_conversations.sql', 'constraint', 'public.jaren_conversations : jaren_conversations_user_id_fkey', 'foreign key'),
    ('0023_jaren_conversations.sql', 'constraint', 'public.jaren_messages : jaren_messages_conversation_id_fkey', 'foreign key'),
    ('0023_jaren_conversations.sql', 'constraint', 'public.jaren_messages : jaren_messages_pkey', 'primary key'),
    ('0023_jaren_conversations.sql', 'constraint', 'public.jaren_messages : jaren_messages_role_check', 'check'),
    ('0023_jaren_conversations.sql', 'index', 'public.jaren_conversations_pkey', ''),
    ('0023_jaren_conversations.sql', 'index', 'public.jaren_conversations_user_id_idx', ''),
    ('0023_jaren_conversations.sql', 'index', 'public.jaren_messages_conversation_id_idx', ''),
    ('0023_jaren_conversations.sql', 'index', 'public.jaren_messages_pkey', ''),
    ('0023_jaren_conversations.sql', 'policy', 'public.jaren_conversations : users can manage their own jaren conversations', 'ALL'),
    ('0023_jaren_conversations.sql', 'policy', 'public.jaren_messages : users can manage messages in their own jaren conversations', 'ALL'),
    ('0023_jaren_conversations.sql', 'rls', 'public.jaren_conversations', 'enabled'),
    ('0023_jaren_conversations.sql', 'rls', 'public.jaren_messages', 'enabled'),
    ('0023_jaren_conversations.sql', 'table', 'public.jaren_conversations', ''),
    ('0023_jaren_conversations.sql', 'table', 'public.jaren_messages', ''),
    ('0024_sql_editor.sql', 'column', 'public.sql_editor_query_log.created_at', 'timestamp with time zone'),
    ('0024_sql_editor.sql', 'column', 'public.sql_editor_query_log.duration_ms', 'integer'),
    ('0024_sql_editor.sql', 'column', 'public.sql_editor_query_log.error_message', 'text'),
    ('0024_sql_editor.sql', 'column', 'public.sql_editor_query_log.id', 'uuid'),
    ('0024_sql_editor.sql', 'column', 'public.sql_editor_query_log.org_id', 'uuid'),
    ('0024_sql_editor.sql', 'column', 'public.sql_editor_query_log.query', 'text'),
    ('0024_sql_editor.sql', 'column', 'public.sql_editor_query_log.row_count', 'integer'),
    ('0024_sql_editor.sql', 'column', 'public.sql_editor_query_log.status', 'text'),
    ('0024_sql_editor.sql', 'column', 'public.sql_editor_query_log.user_id', 'uuid'),
    ('0024_sql_editor.sql', 'column default', 'public.sql_editor_query_log.created_at', 'now()'),
    ('0024_sql_editor.sql', 'column default', 'public.sql_editor_query_log.id', 'gen_random_uuid()'),
    ('0024_sql_editor.sql', 'constraint', 'public.sql_editor_query_log : sql_editor_query_log_org_id_fkey', 'foreign key'),
    ('0024_sql_editor.sql', 'constraint', 'public.sql_editor_query_log : sql_editor_query_log_pkey', 'primary key'),
    ('0024_sql_editor.sql', 'constraint', 'public.sql_editor_query_log : sql_editor_query_log_status_check', 'check'),
    ('0024_sql_editor.sql', 'constraint', 'public.sql_editor_query_log : sql_editor_query_log_user_id_fkey', 'foreign key'),
    ('0024_sql_editor.sql', 'function', 'public._log_sql_editor_query(p_org_id uuid, p_user_id uuid, p_query text, p_row_count integer, p_status text, p_error_message text, p_duration_ms integer)', ''),
    ('0024_sql_editor.sql', 'function', 'public.run_sql_editor_query(query text)', ''),
    ('0024_sql_editor.sql', 'function body', 'public._log_sql_editor_query(p_org_id uuid, p_user_id uuid, p_query text, p_row_count integer, p_status text, p_error_message text, p_duration_ms integer)', '49051554c780b0209881bb05ea56b131'),
    ('0024_sql_editor.sql', 'function body', 'public.run_sql_editor_query(query text)', 'aa8bd87ae4968d775e422f05b1057fab'),
    ('0024_sql_editor.sql', 'index', 'public.sql_editor_query_log_org_id_idx', ''),
    ('0024_sql_editor.sql', 'index', 'public.sql_editor_query_log_pkey', ''),
    ('0024_sql_editor.sql', 'policy', 'public.sql_editor_query_log : org admins can view sql editor query log', 'SELECT'),
    ('0024_sql_editor.sql', 'rls', 'public.sql_editor_query_log', 'enabled'),
    ('0024_sql_editor.sql', 'table', 'public.sql_editor_query_log', ''),
    ('0025_org_role_sys_admin.sql', 'enum value', 'public.org_role.sys_admin', ''),
    ('0026_ai_agents.sql', 'column', 'public.agent_autonomy_settings.autonomy_level', 'text'),
    ('0026_ai_agents.sql', 'column', 'public.agent_autonomy_settings.org_id', 'uuid'),
    ('0026_ai_agents.sql', 'column', 'public.agent_autonomy_settings.updated_at', 'timestamp with time zone'),
    ('0026_ai_agents.sql', 'column', 'public.agent_autonomy_settings.updated_by', 'uuid'),
    ('0026_ai_agents.sql', 'column', 'public.profiles.description', 'text'),
    ('0026_ai_agents.sql', 'column', 'public.profiles.is_agent', 'boolean'),
    ('0026_ai_agents.sql', 'column', 'public.profiles.title', 'text'),
    ('0026_ai_agents.sql', 'column default', 'public.agent_autonomy_settings.autonomy_level', '''full_autonomy''::text'),
    ('0026_ai_agents.sql', 'column default', 'public.agent_autonomy_settings.updated_at', 'now()'),
    ('0026_ai_agents.sql', 'column default', 'public.profiles.is_agent', 'false'),
    ('0026_ai_agents.sql', 'constraint', 'public.agent_autonomy_settings : agent_autonomy_settings_autonomy_level_check', 'check'),
    ('0026_ai_agents.sql', 'constraint', 'public.agent_autonomy_settings : agent_autonomy_settings_org_id_fkey', 'foreign key'),
    ('0026_ai_agents.sql', 'constraint', 'public.agent_autonomy_settings : agent_autonomy_settings_pkey', 'primary key'),
    ('0026_ai_agents.sql', 'constraint', 'public.agent_autonomy_settings : agent_autonomy_settings_updated_by_fkey', 'foreign key'),
    ('0026_ai_agents.sql', 'function body', 'public.is_org_admin(check_org_id uuid)', 'd89e9966f12efb3432e18a575d566c48'),
    ('0026_ai_agents.sql', 'index', 'public.agent_autonomy_settings_pkey', ''),
    ('0026_ai_agents.sql', 'policy', 'public.agent_autonomy_settings : human org admins can manage agent autonomy settings', 'ALL'),
    ('0026_ai_agents.sql', 'rls', 'public.agent_autonomy_settings', 'enabled'),
    ('0026_ai_agents.sql', 'table', 'public.agent_autonomy_settings', ''),
    ('0027_security_rules.sql', 'column', 'public.data_sensitivity_labels.column_name', 'text'),
    ('0027_security_rules.sql', 'column', 'public.data_sensitivity_labels.compliance_frameworks', 'text[]'),
    ('0027_security_rules.sql', 'column', 'public.data_sensitivity_labels.created_at', 'timestamp with time zone'),
    ('0027_security_rules.sql', 'column', 'public.data_sensitivity_labels.created_by', 'uuid'),
    ('0027_security_rules.sql', 'column', 'public.data_sensitivity_labels.id', 'uuid'),
    ('0027_security_rules.sql', 'column', 'public.data_sensitivity_labels.label', 'data_sensitivity_label'),
    ('0027_security_rules.sql', 'column', 'public.data_sensitivity_labels.notes', 'text'),
    ('0027_security_rules.sql', 'column', 'public.data_sensitivity_labels.org_id', 'uuid'),
    ('0027_security_rules.sql', 'column', 'public.data_sensitivity_labels.table_name', 'text'),
    ('0027_security_rules.sql', 'column', 'public.security_findings.actor_user_id', 'uuid'),
    ('0027_security_rules.sql', 'column', 'public.security_findings.category', 'security_rule_category'),
    ('0027_security_rules.sql', 'column', 'public.security_findings.created_at', 'timestamp with time zone'),
    ('0027_security_rules.sql', 'column', 'public.security_findings.details', 'jsonb'),
    ('0027_security_rules.sql', 'column', 'public.security_findings.detected_by', 'uuid'),
    ('0027_security_rules.sql', 'column', 'public.security_findings.id', 'uuid'),
    ('0027_security_rules.sql', 'column', 'public.security_findings.org_id', 'uuid'),
    ('0027_security_rules.sql', 'column', 'public.security_findings.resolution_note', 'text'),
    ('0027_security_rules.sql', 'column', 'public.security_findings.resolved_at', 'timestamp with time zone'),
    ('0027_security_rules.sql', 'column', 'public.security_findings.resolved_by', 'uuid'),
    ('0027_security_rules.sql', 'column', 'public.security_findings.rule_id', 'uuid'),
    ('0027_security_rules.sql', 'column', 'public.security_findings.severity', 'security_severity'),
    ('0027_security_rules.sql', 'column', 'public.security_findings.status', 'security_finding_status'),
    ('0027_security_rules.sql', 'column', 'public.security_findings.summary', 'text'),
    ('0027_security_rules.sql', 'column', 'public.security_rules.action', 'text'),
    ('0027_security_rules.sql', 'column', 'public.security_rules.category', 'security_rule_category'),
    ('0027_security_rules.sql', 'column', 'public.security_rules.condition', 'jsonb'),
    ('0027_security_rules.sql', 'column', 'public.security_rules.created_at', 'timestamp with time zone'),
    ('0027_security_rules.sql', 'column', 'public.security_rules.created_by', 'uuid'),
    ('0027_security_rules.sql', 'column', 'public.security_rules.description', 'text'),
    ('0027_security_rules.sql', 'column', 'public.security_rules.effect', 'security_rule_effect'),
    ('0027_security_rules.sql', 'column', 'public.security_rules.id', 'uuid'),
    ('0027_security_rules.sql', 'column', 'public.security_rules.is_active', 'boolean'),
    ('0027_security_rules.sql', 'column', 'public.security_rules.name', 'text'),
    ('0027_security_rules.sql', 'column', 'public.security_rules.org_id', 'uuid'),
    ('0027_security_rules.sql', 'column', 'public.security_rules.resource', 'text'),
    ('0027_security_rules.sql', 'column', 'public.security_rules.severity', 'security_severity'),
    ('0027_security_rules.sql', 'column', 'public.security_rules.updated_at', 'timestamp with time zone'),
    ('0027_security_rules.sql', 'column default', 'public.data_sensitivity_labels.compliance_frameworks', '''{}''::text[]'),
    ('0027_security_rules.sql', 'column default', 'public.data_sensitivity_labels.created_at', 'now()'),
    ('0027_security_rules.sql', 'column default', 'public.data_sensitivity_labels.id', 'gen_random_uuid()'),
    ('0027_security_rules.sql', 'column default', 'public.security_findings.created_at', 'now()'),
    ('0027_security_rules.sql', 'column default', 'public.security_findings.details', '''{}''::jsonb'),
    ('0027_security_rules.sql', 'column default', 'public.security_findings.id', 'gen_random_uuid()'),
    ('0027_security_rules.sql', 'column default', 'public.security_findings.severity', '''medium''::security_severity'),
    ('0027_security_rules.sql', 'column default', 'public.security_findings.status', '''open''::security_finding_status'),
    ('0027_security_rules.sql', 'column default', 'public.security_rules.action', '''*''::text'),
    ('0027_security_rules.sql', 'column default', 'public.security_rules.condition', '''{}''::jsonb'),
    ('0027_security_rules.sql', 'column default', 'public.security_rules.created_at', 'now()'),
    ('0027_security_rules.sql', 'column default', 'public.security_rules.effect', '''alert''::security_rule_effect'),
    ('0027_security_rules.sql', 'column default', 'public.security_rules.id', 'gen_random_uuid()'),
    ('0027_security_rules.sql', 'column default', 'public.security_rules.is_active', 'true'),
    ('0027_security_rules.sql', 'column default', 'public.security_rules.resource', '''*''::text'),
    ('0027_security_rules.sql', 'column default', 'public.security_rules.severity', '''medium''::security_severity'),
    ('0027_security_rules.sql', 'column default', 'public.security_rules.updated_at', 'now()'),
    ('0027_security_rules.sql', 'constraint', 'public.data_sensitivity_labels : data_sensitivity_labels_created_by_fkey', 'foreign key'),
    ('0027_security_rules.sql', 'constraint', 'public.data_sensitivity_labels : data_sensitivity_labels_org_id_fkey', 'foreign key'),
    ('0027_security_rules.sql', 'constraint', 'public.data_sensitivity_labels : data_sensitivity_labels_org_id_table_name_column_name_key', 'unique'),
    ('0027_security_rules.sql', 'constraint', 'public.data_sensitivity_labels : data_sensitivity_labels_pkey', 'primary key'),
    ('0027_security_rules.sql', 'constraint', 'public.security_findings : security_findings_actor_user_id_fkey', 'foreign key'),
    ('0027_security_rules.sql', 'constraint', 'public.security_findings : security_findings_detected_by_fkey', 'foreign key'),
    ('0027_security_rules.sql', 'constraint', 'public.security_findings : security_findings_org_id_fkey', 'foreign key'),
    ('0027_security_rules.sql', 'constraint', 'public.security_findings : security_findings_pkey', 'primary key'),
    ('0027_security_rules.sql', 'constraint', 'public.security_findings : security_findings_resolved_by_fkey', 'foreign key'),
    ('0027_security_rules.sql', 'constraint', 'public.security_findings : security_findings_rule_id_fkey', 'foreign key'),
    ('0027_security_rules.sql', 'constraint', 'public.security_rules : security_rules_created_by_fkey', 'foreign key'),
    ('0027_security_rules.sql', 'constraint', 'public.security_rules : security_rules_org_id_fkey', 'foreign key'),
    ('0027_security_rules.sql', 'constraint', 'public.security_rules : security_rules_pkey', 'primary key'),
    ('0027_security_rules.sql', 'enum', 'public.data_sensitivity_label', ''),
    ('0027_security_rules.sql', 'enum', 'public.security_finding_status', ''),
    ('0027_security_rules.sql', 'enum', 'public.security_rule_category', ''),
    ('0027_security_rules.sql', 'enum', 'public.security_rule_effect', ''),
    ('0027_security_rules.sql', 'enum', 'public.security_severity', ''),
    ('0027_security_rules.sql', 'enum value', 'public.data_sensitivity_label.confidential', ''),
    ('0027_security_rules.sql', 'enum value', 'public.data_sensitivity_label.financial', ''),
    ('0027_security_rules.sql', 'enum value', 'public.data_sensitivity_label.health', ''),
    ('0027_security_rules.sql', 'enum value', 'public.data_sensitivity_label.internal', ''),
    ('0027_security_rules.sql', 'enum value', 'public.data_sensitivity_label.pii', ''),
    ('0027_security_rules.sql', 'enum value', 'public.data_sensitivity_label.public', ''),
    ('0027_security_rules.sql', 'enum value', 'public.security_finding_status.acknowledged', ''),
    ('0027_security_rules.sql', 'enum value', 'public.security_finding_status.dismissed', ''),
    ('0027_security_rules.sql', 'enum value', 'public.security_finding_status.open', ''),
    ('0027_security_rules.sql', 'enum value', 'public.security_finding_status.resolved', ''),
    ('0027_security_rules.sql', 'enum value', 'public.security_rule_category.access_policy', ''),
    ('0027_security_rules.sql', 'enum value', 'public.security_rule_category.anomaly', ''),
    ('0027_security_rules.sql', 'enum value', 'public.security_rule_category.data_sensitivity', ''),
    ('0027_security_rules.sql', 'enum value', 'public.security_rule_effect.alert', ''),
    ('0027_security_rules.sql', 'enum value', 'public.security_rule_effect.allow', ''),
    ('0027_security_rules.sql', 'enum value', 'public.security_rule_effect.block', ''),
    ('0027_security_rules.sql', 'enum value', 'public.security_rule_effect.require_approval', ''),
    ('0027_security_rules.sql', 'enum value', 'public.security_severity.critical', ''),
    ('0027_security_rules.sql', 'enum value', 'public.security_severity.high', ''),
    ('0027_security_rules.sql', 'enum value', 'public.security_severity.low', ''),
    ('0027_security_rules.sql', 'enum value', 'public.security_severity.medium', ''),
    ('0027_security_rules.sql', 'function', 'public.is_human_org_admin(check_org_id uuid)', ''),
    ('0027_security_rules.sql', 'function body', 'public.is_human_org_admin(check_org_id uuid)', '852c8152c707250ebbab95596ec4c0e8'),
    ('0027_security_rules.sql', 'index', 'public.data_sensitivity_labels_org_id_table_name_column_name_key', ''),
    ('0027_security_rules.sql', 'index', 'public.data_sensitivity_labels_pkey', ''),
    ('0027_security_rules.sql', 'index', 'public.security_findings_org_id_idx', ''),
    ('0027_security_rules.sql', 'index', 'public.security_findings_pkey', ''),
    ('0027_security_rules.sql', 'index', 'public.security_rules_org_id_idx', ''),
    ('0027_security_rules.sql', 'index', 'public.security_rules_pkey', ''),
    ('0027_security_rules.sql', 'policy', 'public.data_sensitivity_labels : human org admins can change data sensitivity labels', 'UPDATE'),
    ('0027_security_rules.sql', 'policy', 'public.data_sensitivity_labels : human org admins can remove data sensitivity labels', 'DELETE'),
    ('0027_security_rules.sql', 'policy', 'public.data_sensitivity_labels : org admins incl agents can tag data sensitivity', 'INSERT'),
    ('0027_security_rules.sql', 'policy', 'public.data_sensitivity_labels : org admins incl agents can view data sensitivity labels', 'SELECT'),
    ('0027_security_rules.sql', 'policy', 'public.security_findings : human org admins can update security findings', 'UPDATE'),
    ('0027_security_rules.sql', 'policy', 'public.security_findings : org admins incl agents can raise security findings', 'INSERT'),
    ('0027_security_rules.sql', 'policy', 'public.security_findings : org admins incl agents can view security findings', 'SELECT'),
    ('0027_security_rules.sql', 'policy', 'public.security_rules : human org admins can change security rules', 'UPDATE'),
    ('0027_security_rules.sql', 'policy', 'public.security_rules : human org admins can remove security rules', 'DELETE'),
    ('0027_security_rules.sql', 'policy', 'public.security_rules : org admins incl agents can propose security rules', 'INSERT'),
    ('0027_security_rules.sql', 'policy', 'public.security_rules : org admins incl agents can view security rules', 'SELECT'),
    ('0027_security_rules.sql', 'rls', 'public.data_sensitivity_labels', 'enabled'),
    ('0027_security_rules.sql', 'rls', 'public.security_findings', 'enabled'),
    ('0027_security_rules.sql', 'rls', 'public.security_rules', 'enabled'),
    ('0027_security_rules.sql', 'table', 'public.data_sensitivity_labels', ''),
    ('0027_security_rules.sql', 'table', 'public.security_findings', ''),
    ('0027_security_rules.sql', 'table', 'public.security_rules', ''),
    ('0028_enhancement_tasks.sql', 'column', 'public.enhancement_tasks.created_at', 'timestamp with time zone'),
    ('0028_enhancement_tasks.sql', 'column', 'public.enhancement_tasks.created_by', 'uuid'),
    ('0028_enhancement_tasks.sql', 'column', 'public.enhancement_tasks.description', 'text'),
    ('0028_enhancement_tasks.sql', 'column', 'public.enhancement_tasks.id', 'uuid'),
    ('0028_enhancement_tasks.sql', 'column', 'public.enhancement_tasks.notes', 'text'),
    ('0028_enhancement_tasks.sql', 'column', 'public.enhancement_tasks.org_id', 'uuid'),
    ('0028_enhancement_tasks.sql', 'column', 'public.enhancement_tasks.priority', 'enhancement_task_priority'),
    ('0028_enhancement_tasks.sql', 'column', 'public.enhancement_tasks.status', 'enhancement_task_status'),
    ('0028_enhancement_tasks.sql', 'column', 'public.enhancement_tasks.title', 'text'),
    ('0028_enhancement_tasks.sql', 'column', 'public.enhancement_tasks.updated_at', 'timestamp with time zone'),
    ('0028_enhancement_tasks.sql', 'column default', 'public.enhancement_tasks.created_at', 'now()'),
    ('0028_enhancement_tasks.sql', 'column default', 'public.enhancement_tasks.id', 'gen_random_uuid()'),
    ('0028_enhancement_tasks.sql', 'column default', 'public.enhancement_tasks.priority', '''medium''::enhancement_task_priority'),
    ('0028_enhancement_tasks.sql', 'column default', 'public.enhancement_tasks.status', '''backlog''::enhancement_task_status'),
    ('0028_enhancement_tasks.sql', 'column default', 'public.enhancement_tasks.updated_at', 'now()'),
    ('0028_enhancement_tasks.sql', 'constraint', 'public.enhancement_tasks : enhancement_tasks_created_by_fkey', 'foreign key'),
    ('0028_enhancement_tasks.sql', 'constraint', 'public.enhancement_tasks : enhancement_tasks_org_id_fkey', 'foreign key'),
    ('0028_enhancement_tasks.sql', 'constraint', 'public.enhancement_tasks : enhancement_tasks_pkey', 'primary key'),
    ('0028_enhancement_tasks.sql', 'enum', 'public.enhancement_task_priority', ''),
    ('0028_enhancement_tasks.sql', 'enum', 'public.enhancement_task_status', ''),
    ('0028_enhancement_tasks.sql', 'enum value', 'public.enhancement_task_priority.high', ''),
    ('0028_enhancement_tasks.sql', 'enum value', 'public.enhancement_task_priority.low', ''),
    ('0028_enhancement_tasks.sql', 'enum value', 'public.enhancement_task_priority.medium', ''),
    ('0028_enhancement_tasks.sql', 'enum value', 'public.enhancement_task_status.backlog', ''),
    ('0028_enhancement_tasks.sql', 'enum value', 'public.enhancement_task_status.done', ''),
    ('0028_enhancement_tasks.sql', 'enum value', 'public.enhancement_task_status.in_progress', ''),
    ('0028_enhancement_tasks.sql', 'index', 'public.enhancement_tasks_org_id_idx', ''),
    ('0028_enhancement_tasks.sql', 'index', 'public.enhancement_tasks_pkey', ''),
    ('0028_enhancement_tasks.sql', 'policy', 'public.enhancement_tasks : org members can create enhancement tasks', 'INSERT'),
    ('0028_enhancement_tasks.sql', 'policy', 'public.enhancement_tasks : org members can delete enhancement tasks', 'DELETE'),
    ('0028_enhancement_tasks.sql', 'policy', 'public.enhancement_tasks : org members can update enhancement tasks', 'UPDATE'),
    ('0028_enhancement_tasks.sql', 'policy', 'public.enhancement_tasks : org members can view enhancement tasks', 'SELECT'),
    ('0028_enhancement_tasks.sql', 'rls', 'public.enhancement_tasks', 'enabled'),
    ('0028_enhancement_tasks.sql', 'table', 'public.enhancement_tasks', ''),
    ('0029_enhancement_task_assignee_due_date.sql', 'column', 'public.enhancement_tasks.assignee', 'text'),
    ('0029_enhancement_task_assignee_due_date.sql', 'column', 'public.enhancement_tasks.due_date', 'date'),
    ('0029_enhancement_task_assignee_due_date.sql', 'index', 'public.enhancement_tasks_due_date_idx', ''),
    ('0030_client_portal_roles.sql', 'column', 'public.client_portal_invites.role', 'client_portal_role'),
    ('0030_client_portal_roles.sql', 'column', 'public.client_portal_users.role', 'client_portal_role'),
    ('0030_client_portal_roles.sql', 'column default', 'public.client_portal_invites.role', '''client_user''::client_portal_role'),
    ('0030_client_portal_roles.sql', 'column default', 'public.client_portal_users.role', '''client_user''::client_portal_role'),
    ('0030_client_portal_roles.sql', 'enum', 'public.client_portal_role', ''),
    ('0030_client_portal_roles.sql', 'enum value', 'public.client_portal_role.client_administrator', ''),
    ('0030_client_portal_roles.sql', 'enum value', 'public.client_portal_role.client_tpa', ''),
    ('0030_client_portal_roles.sql', 'enum value', 'public.client_portal_role.client_user', ''),
    ('0030_client_portal_roles.sql', 'function body', 'public.handle_new_user()', '1a26b9eee3757b033c188c096f595f1d'),
    ('0031_jaren_agent_settings.sql', 'column', 'public.jaren_agent_settings.enhanced_skills', 'text[]'),
    ('0031_jaren_agent_settings.sql', 'column', 'public.jaren_agent_settings.essential_skills', 'text[]'),
    ('0031_jaren_agent_settings.sql', 'column', 'public.jaren_agent_settings.org_id', 'uuid'),
    ('0031_jaren_agent_settings.sql', 'column', 'public.jaren_agent_settings.updated_at', 'timestamp with time zone'),
    ('0031_jaren_agent_settings.sql', 'column', 'public.jaren_agent_settings.updated_by', 'uuid'),
    ('0031_jaren_agent_settings.sql', 'column default', 'public.jaren_agent_settings.enhanced_skills', 'ARRAY[''coding''::text, ''field-mapping''::text, ''business-operations''::text, ''application-design''::text, ''analytics''::text, ''data-innovation''::text, ''technology-innovation''::text, ''tool-engineering''::text]'),
    ('0031_jaren_agent_settings.sql', 'column default', 'public.jaren_agent_settings.updated_at', 'now()'),
    ('0031_jaren_agent_settings.sql', 'constraint', 'public.jaren_agent_settings : jaren_agent_settings_org_id_fkey', 'foreign key'),
    ('0031_jaren_agent_settings.sql', 'constraint', 'public.jaren_agent_settings : jaren_agent_settings_pkey', 'primary key'),
    ('0031_jaren_agent_settings.sql', 'constraint', 'public.jaren_agent_settings : jaren_agent_settings_updated_by_fkey', 'foreign key'),
    ('0031_jaren_agent_settings.sql', 'index', 'public.jaren_agent_settings_pkey', ''),
    ('0031_jaren_agent_settings.sql', 'policy', 'public.jaren_agent_settings : human org admins can manage jaren agent settings', 'ALL'),
    ('0031_jaren_agent_settings.sql', 'policy', 'public.jaren_agent_settings : org members can read jaren agent settings', 'SELECT'),
    ('0031_jaren_agent_settings.sql', 'rls', 'public.jaren_agent_settings', 'enabled'),
    ('0031_jaren_agent_settings.sql', 'table', 'public.jaren_agent_settings', ''),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_mutation_log.after_data', 'jsonb'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_mutation_log.before_data', 'jsonb'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_mutation_log.client_id', 'uuid'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_mutation_log.created_at', 'timestamp with time zone'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_mutation_log.id', 'uuid'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_mutation_log.key_data', 'jsonb'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_mutation_log.operation', 'text'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_mutation_log.org_id', 'uuid'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_mutation_log.table_name', 'text'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_mutation_log.user_id', 'uuid'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_table_config.allow_delete', 'boolean'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_table_config.allow_insert', 'boolean'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_table_config.allow_read', 'boolean'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_table_config.allow_update', 'boolean'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_table_config.client_scope_column', 'text'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_table_config.created_at', 'timestamp with time zone'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_table_config.label', 'text'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_table_config.org_scope_column', 'text'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_table_config.primary_key_columns', 'text[]'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_table_config.protected_columns', 'text[]'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_table_config.sort_order', 'integer'),
    ('0032_data_studio_postgres_rw.sql', 'column', 'public.data_studio_table_config.table_name', 'text'),
    ('0032_data_studio_postgres_rw.sql', 'column default', 'public.data_studio_mutation_log.created_at', 'now()'),
    ('0032_data_studio_postgres_rw.sql', 'column default', 'public.data_studio_mutation_log.id', 'gen_random_uuid()'),
    ('0032_data_studio_postgres_rw.sql', 'column default', 'public.data_studio_mutation_log.key_data', '''{}''::jsonb'),
    ('0032_data_studio_postgres_rw.sql', 'column default', 'public.data_studio_table_config.allow_delete', 'false'),
    ('0032_data_studio_postgres_rw.sql', 'column default', 'public.data_studio_table_config.allow_insert', 'false'),
    ('0032_data_studio_postgres_rw.sql', 'column default', 'public.data_studio_table_config.allow_read', 'true'),
    ('0032_data_studio_postgres_rw.sql', 'column default', 'public.data_studio_table_config.allow_update', 'false'),
    ('0032_data_studio_postgres_rw.sql', 'column default', 'public.data_studio_table_config.created_at', 'now()'),
    ('0032_data_studio_postgres_rw.sql', 'column default', 'public.data_studio_table_config.primary_key_columns', 'ARRAY[''id''::text]'),
    ('0032_data_studio_postgres_rw.sql', 'column default', 'public.data_studio_table_config.protected_columns', 'ARRAY[''id''::text, ''org_id''::text, ''created_by''::text, ''created_at''::text, ''updated_at''::text]'),
    ('0032_data_studio_postgres_rw.sql', 'column default', 'public.data_studio_table_config.sort_order', '100'),
    ('0032_data_studio_postgres_rw.sql', 'constraint', 'public.data_studio_mutation_log : data_studio_mutation_log_client_id_fkey', 'foreign key'),
    ('0032_data_studio_postgres_rw.sql', 'constraint', 'public.data_studio_mutation_log : data_studio_mutation_log_operation_check', 'check'),
    ('0032_data_studio_postgres_rw.sql', 'constraint', 'public.data_studio_mutation_log : data_studio_mutation_log_org_id_fkey', 'foreign key'),
    ('0032_data_studio_postgres_rw.sql', 'constraint', 'public.data_studio_mutation_log : data_studio_mutation_log_pkey', 'primary key'),
    ('0032_data_studio_postgres_rw.sql', 'constraint', 'public.data_studio_mutation_log : data_studio_mutation_log_user_id_fkey', 'foreign key'),
    ('0032_data_studio_postgres_rw.sql', 'constraint', 'public.data_studio_table_config : data_studio_table_config_pkey', 'primary key'),
    ('0032_data_studio_postgres_rw.sql', 'function', 'public.get_data_studio_schema(p_org_id uuid)', ''),
    ('0032_data_studio_postgres_rw.sql', 'function', 'public.run_data_studio_mutation(p_org_id uuid, p_table_name text, p_operation text, p_key jsonb, p_values jsonb, p_client_id uuid)', ''),
    ('0032_data_studio_postgres_rw.sql', 'function body', 'public.get_data_studio_schema(p_org_id uuid)', '2b06ceb551b021a1feca703d17aefe88'),
    ('0032_data_studio_postgres_rw.sql', 'index', 'public.data_studio_mutation_log_org_created_idx', ''),
    ('0032_data_studio_postgres_rw.sql', 'index', 'public.data_studio_mutation_log_pkey', ''),
    ('0032_data_studio_postgres_rw.sql', 'index', 'public.data_studio_mutation_log_table_created_idx', ''),
    ('0032_data_studio_postgres_rw.sql', 'index', 'public.data_studio_table_config_pkey', ''),
    ('0032_data_studio_postgres_rw.sql', 'policy', 'public.data_studio_mutation_log : org admins can view data studio mutation log', 'SELECT'),
    ('0032_data_studio_postgres_rw.sql', 'policy', 'public.data_studio_table_config : org admins can view data studio table config', 'SELECT'),
    ('0032_data_studio_postgres_rw.sql', 'rls', 'public.data_studio_mutation_log', 'enabled'),
    ('0032_data_studio_postgres_rw.sql', 'rls', 'public.data_studio_table_config', 'enabled'),
    ('0032_data_studio_postgres_rw.sql', 'table', 'public.data_studio_mutation_log', ''),
    ('0032_data_studio_postgres_rw.sql', 'table', 'public.data_studio_table_config', ''),
    ('0033_data_studio_private_audit.sql', 'function', 'private._log_data_studio_mutation(p_org_id uuid, p_user_id uuid, p_client_id uuid, p_table_name text, p_operation text, p_key_data jsonb, p_before_data jsonb, p_after_data jsonb)', ''),
    ('0033_data_studio_private_audit.sql', 'function body', 'private._log_data_studio_mutation(p_org_id uuid, p_user_id uuid, p_client_id uuid, p_table_name text, p_operation text, p_key_data jsonb, p_before_data jsonb, p_after_data jsonb)', '72bea963779e7c2f20187ff910e0216a'),
    ('0033_data_studio_private_audit.sql', 'function body', 'public.run_data_studio_mutation(p_org_id uuid, p_table_name text, p_operation text, p_key jsonb, p_values jsonb, p_client_id uuid)', '6b061f669bcf7208199d88a5c31b4dae'),
    ('0033_data_studio_private_audit.sql', 'schema', 'private', ''),
    ('0034_business_agreement_client_ids.sql', 'column', 'public.client_contracts.agreement_number', 'text'),
    ('0034_business_agreement_client_ids.sql', 'column', 'public.clients.client_number', 'text'),
    ('0034_business_agreement_client_ids.sql', 'column default', 'public.client_contracts.agreement_number', '(''AGR-''::text || lpad((nextval(''agreement_business_id_seq''::regclass))::text, 6, ''0''::text))'),
    ('0034_business_agreement_client_ids.sql', 'column default', 'public.clients.client_number', '(''CLI-''::text || lpad((nextval(''client_business_id_seq''::regclass))::text, 6, ''0''::text))'),
    ('0034_business_agreement_client_ids.sql', 'constraint', 'public.client_contracts : client_contracts_agreement_number_format', 'check'),
    ('0034_business_agreement_client_ids.sql', 'constraint', 'public.clients : clients_client_number_format', 'check'),
    ('0034_business_agreement_client_ids.sql', 'index', 'public.client_contracts_agreement_number_key', ''),
    ('0034_business_agreement_client_ids.sql', 'index', 'public.clients_client_number_key', ''),
    ('0034_business_agreement_client_ids.sql', 'sequence', 'public.agreement_business_id_seq', ''),
    ('0034_business_agreement_client_ids.sql', 'sequence', 'public.client_business_id_seq', ''),
    ('0035_jaren_power_bi_skill.sql', 'column default', 'public.jaren_agent_settings.essential_skills', 'ARRAY[''data-extraction''::text, ''data-modeling''::text, ''data-automation''::text, ''design-aesthetics''::text, ''excel-workbooks''::text, ''power-bi''::text, ''sql''::text]')
),
live as (
    -- One row per CPSM-owned database object: (kind, name, detail).
    -- Used twice: by build.sh to snapshot the planned schema after each
    -- migration, and inlined into the generated report to read the live one.
    with ext as (select objid, classid from pg_depend where deptype = 'e'),
    ns as (select oid, nspname from pg_namespace where nspname in ('public', 'private'))
    select 'schema'::text as kind, nspname::text as name, ''::text as detail from ns where nspname <> 'public'
    union all
    select case c.relkind when 'v' then 'view' when 'm' then 'view' when 'S' then 'sequence' else 'table' end,
           n.nspname::text || '.' || c.relname, ''
    from pg_class c join ns n on n.oid = c.relnamespace
    where c.relkind in ('r', 'p', 'v', 'm', 'S')
      and c.oid not in (select objid from ext where classid = 'pg_class'::regclass)
    union all
    select 'rls', n.nspname::text || '.' || c.relname, case when c.relrowsecurity then 'enabled' else 'disabled' end
    from pg_class c join ns n on n.oid = c.relnamespace
    where c.relkind in ('r', 'p')
      and c.oid not in (select objid from ext where classid = 'pg_class'::regclass)
    union all
    select 'column', n.nspname::text || '.' || c.relname || '.' || a.attname, format_type(a.atttypid, a.atttypmod)
    from pg_attribute a join pg_class c on c.oid = a.attrelid join ns n on n.oid = c.relnamespace
    where c.relkind in ('r', 'p', 'v', 'm') and a.attnum > 0 and not a.attisdropped
      and c.oid not in (select objid from ext where classid = 'pg_class'::regclass)
    union all
    select 'column default', n.nspname::text || '.' || c.relname || '.' || a.attname, pg_get_expr(d.adbin, d.adrelid)
    from pg_attrdef d join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
    join pg_class c on c.oid = d.adrelid join ns n on n.oid = c.relnamespace
    where not a.attisdropped
      and c.oid not in (select objid from ext where classid = 'pg_class'::regclass)
    union all
    select 'enum value', n.nspname::text || '.' || t.typname || '.' || e.enumlabel, ''
    from pg_type t join ns n on n.oid = t.typnamespace join pg_enum e on e.enumtypid = t.oid
    union all
    select 'enum', n.nspname::text || '.' || t.typname, ''
    from pg_type t join ns n on n.oid = t.typnamespace
    where t.typtype = 'e'
    union all
    select 'function', n.nspname::text || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', ''
    from pg_proc p join ns n on n.oid = p.pronamespace
    where p.oid not in (select objid from ext where classid = 'pg_proc'::regclass)
    union all
    -- prosrc is the body exactly as written, so this flags a live function
    -- still running an older version from an earlier migration.
    select 'function body', n.nspname::text || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', md5(p.prosrc)
    from pg_proc p join ns n on n.oid = p.pronamespace
    where p.oid not in (select objid from ext where classid = 'pg_proc'::regclass)
    union all
    select 'policy', pol.schemaname::text || '.' || pol.tablename || ' : ' || pol.policyname, pol.cmd
    from pg_policies pol where pol.schemaname in ('public', 'private')
    union all
    select 'index', n.nspname::text || '.' || c.relname, ''
    from pg_class c join ns n on n.oid = c.relnamespace
    where c.relkind in ('i', 'I')
      and c.oid not in (select objid from ext where classid = 'pg_class'::regclass)
    union all
    select 'constraint', n.nspname::text || '.' || c.relname || ' : ' || con.conname,
           case con.contype when 'p' then 'primary key' when 'f' then 'foreign key' when 'u' then 'unique'
                            when 'c' then 'check' else 'exclusion' end
    from pg_constraint con join pg_class c on c.oid = con.conrelid join ns n on n.oid = c.relnamespace
    where con.contype in ('p', 'f', 'u', 'c', 'x')
      and c.oid not in (select objid from ext where classid = 'pg_class'::regclass)
    union all
    -- Triggers count when their function is ours, even on auth.users.
    select 'trigger', tn.nspname::text || '.' || tc.relname || ' : ' || tg.tgname, ''
    from pg_trigger tg join pg_class tc on tc.oid = tg.tgrelid join pg_namespace tn on tn.oid = tc.relnamespace
    join pg_proc p on p.oid = tg.tgfoid join ns pn on pn.oid = p.pronamespace
    where not tg.tgisinternal
    union all
    select 'realtime', pt.schemaname::text || '.' || pt.tablename, ''
    from pg_publication_tables pt where pt.pubname = 'supabase_realtime'
),
compared as (
  select p.migration, p.kind, p.name, p.detail as planned_detail, l.detail as live_detail,
         case when l.name is null then 'missing'
              when p.detail is distinct from l.detail then 'different'
              else 'live' end as state
  from planned p
  left join live l on l.kind = p.kind and l.name = p.name
),
summary as (
  select m.migration, m.enhancement,
         count(c.name) as total,
         count(c.name) filter (where c.state = 'live') as live_count
  from migrations m
  left join compared c on c.migration = m.migration
  group by m.migration, m.enhancement
)
select section, migration, enhancement, status, kind, object, planned, live
from (
  select '1 - Enhancement summary' as section, s.migration, s.enhancement,
         case when s.total = 0 then 'NO SCHEMA OBJECTS (data-only)'
              when s.live_count = s.total then 'LIVE'
              when s.live_count = 0 then 'NOT APPLIED'
              else 'PARTIAL (' || s.live_count || ' of ' || s.total || ' live)' end as status,
         null::text as kind, null::text as object,
         s.total || ' objects' as planned, s.live_count || ' live' as live
  from summary s
  union all
  select case c.state when 'missing' then '2 - Missing from live' else '3 - Live but different' end,
         c.migration, m.enhancement, upper(c.state), c.kind, c.name,
         nullif(c.planned_detail, ''), nullif(c.live_detail, '')
  from compared c
  join migrations m on m.migration = c.migration
  where c.state <> 'live'
  union all
  select '4 - Live only', null, null, 'NOT IN ANY MIGRATION', l.kind, l.name, null, nullif(l.detail, '')
  from live l
  where l.kind not in ('function body', 'column default', 'rls')
    and not exists (select 1 from planned p where p.kind = l.kind and p.name = l.name)
) report
order by section, migration nulls last, kind, object;

-- ==========================================================================
-- PART 3 - FULL PLANNED SCHEMA (reference only, inside a comment)
-- End state after every migration, from pg_dump --schema-only. Not shown:
-- the on_auth_user_created trigger on auth.users (0001/0011), which lives
-- in Supabase's auth schema; see Part 1 and the report for it.
-- ==========================================================================
/*
--
-- PostgreSQL database dump
--

--
-- Name: private; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA private;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';

--
-- Name: client_portal_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.client_portal_role AS ENUM (
    'client_user',
    'client_administrator',
    'client_tpa'
);

--
-- Name: client_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.client_status AS ENUM (
    'active',
    'prospect',
    'inactive'
);

--
-- Name: contract_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.contract_status AS ENUM (
    'draft',
    'sent',
    'signed',
    'active',
    'expired',
    'terminated'
);

--
-- Name: data_sensitivity_label; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.data_sensitivity_label AS ENUM (
    'public',
    'internal',
    'confidential',
    'pii',
    'financial',
    'health'
);

--
-- Name: data_source_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.data_source_status AS ENUM (
    'connected',
    'disconnected',
    'error',
    'pending'
);

--
-- Name: data_source_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.data_source_type AS ENUM (
    'spreadsheet',
    'google_sheets',
    'rest_api',
    'sql_database',
    'hcm',
    'erp',
    'webhook',
    'tax_filing',
    'adp_workforce_now',
    'paychex_flex',
    'web_scraper'
);

--
-- Name: enhancement_task_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enhancement_task_priority AS ENUM (
    'low',
    'medium',
    'high'
);

--
-- Name: enhancement_task_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enhancement_task_status AS ENUM (
    'backlog',
    'in_progress',
    'done'
);

--
-- Name: invoice_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invoice_status AS ENUM (
    'draft',
    'sent',
    'paid',
    'overdue',
    'void'
);

--
-- Name: onboarding_stage; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.onboarding_stage AS ENUM (
    'not_started',
    'contract_sent',
    'contract_signed',
    'in_progress',
    'completed'
);

--
-- Name: org_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.org_role AS ENUM (
    'owner',
    'admin',
    'member',
    'viewer',
    'sys_admin'
);

--
-- Name: pipeline_run_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pipeline_run_status AS ENUM (
    'queued',
    'running',
    'succeeded',
    'failed',
    'partial'
);

--
-- Name: security_finding_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.security_finding_status AS ENUM (
    'open',
    'acknowledged',
    'resolved',
    'dismissed'
);

--
-- Name: security_rule_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.security_rule_category AS ENUM (
    'access_policy',
    'anomaly',
    'data_sensitivity'
);

--
-- Name: security_rule_effect; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.security_rule_effect AS ENUM (
    'block',
    'require_approval',
    'alert',
    'allow'
);

--
-- Name: security_severity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.security_severity AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

--
-- Name: signup_request_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.signup_request_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);

--
-- Name: timecard_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.timecard_status AS ENUM (
    'draft',
    'internally_approved',
    'sent',
    'client_approved',
    'client_rejected'
);

--
-- Name: webhook_direction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.webhook_direction AS ENUM (
    'inbound',
    'outbound'
);

--
-- Name: workflow_instance_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.workflow_instance_status AS ENUM (
    'active',
    'completed',
    'cancelled'
);

--
-- Name: workflow_task_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.workflow_task_status AS ENUM (
    'pending',
    'in_progress',
    'done',
    'skipped'
);

--
-- Name: _log_data_studio_mutation(uuid, uuid, uuid, text, text, jsonb, jsonb, jsonb); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private._log_data_studio_mutation(p_org_id uuid, p_user_id uuid, p_client_id uuid, p_table_name text, p_operation text, p_key_data jsonb, p_before_data jsonb, p_after_data jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'private'
    AS $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Invalid mutation audit identity.';
  end if;

  if not exists (
    select 1
    from public.org_members om
    where om.org_id = p_org_id
      and om.user_id = p_user_id
      and om.role in ('owner', 'admin')
  ) then
    raise exception 'Only organization owners and admins can write through Data Studio.';
  end if;

  insert into public.data_studio_mutation_log
    (org_id, user_id, client_id, table_name, operation, key_data, before_data, after_data)
  values
    (p_org_id, p_user_id, p_client_id, p_table_name, p_operation,
     coalesce(p_key_data, '{}'::jsonb), p_before_data, p_after_data);
end;
$$;

--
-- Name: _log_sql_editor_query(uuid, uuid, text, integer, text, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._log_sql_editor_query(p_org_id uuid, p_user_id uuid, p_query text, p_row_count integer, p_status text, p_error_message text, p_duration_ms integer) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.sql_editor_query_log
    (org_id, user_id, query, row_count, status, error_message, duration_ms)
  values (
    p_org_id,
    p_user_id,
    left(p_query, 8000),
    p_row_count,
    p_status,
    left(p_error_message, 2000),
    p_duration_ms
  );
end;
$$;

--
-- Name: get_data_studio_schema(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_data_studio_schema(p_org_id uuid) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
declare
  v_result jsonb;
begin
  if not exists (
    select 1
    from public.org_members om
    where om.org_id = p_org_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
  ) then
    raise exception 'The Data Studio is limited to organization owners and admins.';
  end if;

  select coalesce(jsonb_agg(table_json order by sort_order, table_name), '[]'::jsonb)
  into v_result
  from (
    select
      c.sort_order,
      c.table_name,
      jsonb_build_object(
        'tableName', c.table_name,
        'label', c.label,
        'primaryKeyColumns', to_jsonb(c.primary_key_columns),
        'orgScopeColumn', c.org_scope_column,
        'clientScopeColumn', c.client_scope_column,
        'allowRead', c.allow_read,
        'allowInsert', c.allow_insert,
        'allowUpdate', c.allow_update,
        'allowDelete', c.allow_delete,
        'protectedColumns', to_jsonb(c.protected_columns),
        'columns', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'name', cols.column_name,
              'dataType', cols.data_type,
              'udtName', cols.udt_name,
              'nullable', cols.is_nullable = 'YES',
              'defaultValue', cols.column_default,
              'identity', cols.is_identity = 'YES',
              'generated', cols.is_generated <> 'NEVER'
            )
            order by cols.ordinal_position
          )
          from information_schema.columns cols
          where cols.table_schema = 'public'
            and cols.table_name = c.table_name
        ), '[]'::jsonb)
      ) as table_json
    from public.data_studio_table_config c
    where c.allow_read = true
      and exists (
        select 1
        from information_schema.tables t
        where t.table_schema = 'public'
          and t.table_name = c.table_name
          and t.table_type = 'BASE TABLE'
      )
  ) configured;

  return v_result;
end;
$$;

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  invite_token text;
  invite_row public.org_invites%rowtype;
  client_invite_token text;
  client_invite_row public.client_portal_invites%rowtype;
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  client_invite_token := new.raw_user_meta_data ->> 'client_invite_token';

  if client_invite_token is not null then
    select * into client_invite_row
    from public.client_portal_invites
    where token = client_invite_token::uuid
      and lower(email) = lower(new.email)
      and accepted_at is null
      and expires_at > now()
    limit 1;

    if client_invite_row.id is not null then
      insert into public.client_portal_users (id, org_id, client_id, email, role)
      values (new.id, client_invite_row.org_id, client_invite_row.client_id, new.email, client_invite_row.role);

      update public.client_portal_invites
      set accepted_at = now()
      where id = client_invite_row.id;

      return new;
    end if;
  end if;

  invite_token := new.raw_user_meta_data ->> 'invite_token';

  if invite_token is not null then
    select * into invite_row
    from public.org_invites
    where token = invite_token::uuid
      and lower(email) = lower(new.email)
      and accepted_at is null
      and expires_at > now()
    limit 1;
  end if;

  if invite_row.id is not null then
    insert into public.org_members (org_id, user_id, role)
    values (invite_row.org_id, new.id, invite_row.role);

    update public.org_invites
    set accepted_at = now()
    where id = invite_row.id;
  else
    insert into public.signup_requests (user_id, email, full_name, company_name)
    values (
      new.id,
      new.email,
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'company_name'
    );
  end if;

  return new;
end;
$$;

--
-- Name: is_any_org_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_any_org_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.org_members
    where user_id = auth.uid() and role in ('owner', 'admin')
  );
$$;

--
-- Name: is_client_portal_user(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_client_portal_user(check_client_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.client_portal_users
    where client_id = check_client_id and id = auth.uid()
  );
$$;

--
-- Name: is_human_org_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_human_org_admin(check_org_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.org_members
    where org_id = check_org_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

--
-- Name: is_org_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_org_admin(check_org_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.org_members
    where org_id = check_org_id
      and user_id = auth.uid()
      and role in ('owner', 'admin', 'sys_admin')
  );
$$;

--
-- Name: is_org_member(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_org_member(check_org_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.org_members
    where org_id = check_org_id and user_id = auth.uid()
  );
$$;

--
-- Name: run_data_studio_mutation(uuid, text, text, jsonb, jsonb, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.run_data_studio_mutation(p_org_id uuid, p_table_name text, p_operation text, p_key jsonb DEFAULT '{}'::jsonb, p_values jsonb DEFAULT '{}'::jsonb, p_client_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO 'public', 'private'
    SET statement_timeout TO '5s'
    AS $_$
declare
  v_cfg public.data_studio_table_config%rowtype;
  v_operation text := lower(btrim(coalesce(p_operation, '')));
  v_values jsonb := coalesce(p_values, '{}'::jsonb);
  v_key jsonb := coalesce(p_key, '{}'::jsonb);
  v_user_id uuid := auth.uid();
  v_key_predicate text;
  v_scope_predicate text := 'true';
  v_columns text;
  v_select_columns text;
  v_set_clause text;
  v_before jsonb;
  v_after jsonb;
  v_client_from_values uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if not exists (
    select 1 from public.org_members om
    where om.org_id = p_org_id
      and om.user_id = v_user_id
      and om.role in ('owner', 'admin')
  ) then
    raise exception 'The Data Studio is limited to organization owners and admins.';
  end if;

  select * into v_cfg
  from public.data_studio_table_config
  where table_name = p_table_name;

  if not found then
    raise exception 'Table % is not enabled for Data Studio.', p_table_name;
  end if;

  if v_operation not in ('insert', 'update', 'delete') then
    raise exception 'Data Studio only supports insert, update, and delete mutations.';
  end if;

  if (v_operation = 'insert' and not v_cfg.allow_insert)
     or (v_operation = 'update' and not v_cfg.allow_update)
     or (v_operation = 'delete' and not v_cfg.allow_delete) then
    raise exception '% is not enabled for table %.', upper(v_operation), p_table_name;
  end if;

  if p_client_id is not null then
    if not exists (
      select 1 from public.clients c
      where c.id = p_client_id and c.org_id = p_org_id
    ) then
      raise exception 'Unknown client for this organization.';
    end if;

    if v_cfg.client_scope_column is null then
      raise exception 'Table % is organization-scoped and does not support client filtering.', p_table_name;
    end if;
  end if;

  if exists (
    select 1 from jsonb_object_keys(v_values) k
    where not exists (
      select 1 from information_schema.columns cols
      where cols.table_schema = 'public'
        and cols.table_name = p_table_name
        and cols.column_name = k
        and cols.is_generated = 'NEVER'
        and cols.is_identity = 'NO'
    )
  ) then
    raise exception 'Mutation contains an unknown, generated, or identity column.';
  end if;

  if v_operation in ('update', 'delete') then
    if exists (
      select 1 from unnest(v_cfg.primary_key_columns) pk
      where not (v_key ? pk)
    ) then
      raise exception 'All primary key fields are required for update/delete.';
    end if;

    if exists (
      select 1 from jsonb_object_keys(v_key) k
      where not (k = any(v_cfg.primary_key_columns))
    ) then
      raise exception 'Only configured primary key fields may be used to identify a row.';
    end if;
  end if;

  if v_operation in ('insert', 'update') and v_values = '{}'::jsonb then
    raise exception 'Enter at least one value to write.';
  end if;

  if exists (
    select 1 from jsonb_object_keys(v_values) k
    where k = any(v_cfg.protected_columns)
       or k = v_cfg.org_scope_column
       or (v_operation = 'update' and k = v_cfg.client_scope_column)
  ) then
    raise exception 'Mutation attempts to change a protected identity or scope column.';
  end if;

  if v_operation = 'insert' then
    if v_cfg.org_scope_column is not null then
      v_values := jsonb_set(v_values, array[v_cfg.org_scope_column], to_jsonb(p_org_id), true);
    end if;

    if exists (
      select 1 from information_schema.columns cols
      where cols.table_schema = 'public'
        and cols.table_name = p_table_name
        and cols.column_name = 'created_by'
    ) then
      v_values := jsonb_set(v_values, array['created_by'], to_jsonb(v_user_id), true);
    end if;

    if v_cfg.client_scope_column is not null then
      if v_cfg.client_scope_column = any(v_cfg.primary_key_columns) then
        if p_client_id is not null then
          raise exception 'Create new client records from organization scope, not an existing client scope.';
        end if;
      elsif p_client_id is not null then
        v_values := jsonb_set(v_values, array[v_cfg.client_scope_column], to_jsonb(p_client_id), true);
      elsif v_values ? v_cfg.client_scope_column then
        begin
          v_client_from_values := (v_values ->> v_cfg.client_scope_column)::uuid;
        exception when others then
          raise exception 'Client scope value must be a valid UUID.';
        end;

        if not exists (
          select 1 from public.clients c
          where c.id = v_client_from_values and c.org_id = p_org_id
        ) then
          raise exception 'Inserted record references a client outside this organization.';
        end if;
      end if;
    end if;
  end if;

  if v_cfg.org_scope_column is not null then
    v_scope_predicate := v_scope_predicate || format(
      ' and target.%I = %L::uuid', v_cfg.org_scope_column, p_org_id::text
    );
  end if;

  if p_client_id is not null and v_cfg.client_scope_column is not null then
    v_scope_predicate := v_scope_predicate || format(
      ' and target.%I = %L::uuid', v_cfg.client_scope_column, p_client_id::text
    );
  end if;

  if v_operation in ('update', 'delete') then
    select string_agg(
      format('target.%I is not distinct from keyrow.%I', pk, pk),
      ' and '
    )
    into v_key_predicate
    from unnest(v_cfg.primary_key_columns) pk;

    v_key_predicate := '(' || v_key_predicate || ') and ' || v_scope_predicate;

    execute format(
      'select to_jsonb(target) from public.%I target '
      || 'cross join jsonb_populate_record(null::public.%I, $1) keyrow '
      || 'where %s limit 1',
      p_table_name, p_table_name, v_key_predicate
    )
    using v_key
    into v_before;

    if v_before is null then
      raise exception 'No row matched the selected organization/client scope and primary key.';
    end if;
  end if;

  if v_operation = 'insert' then
    select
      string_agg(format('%I', k), ', ' order by k),
      string_agg(format('src.%I', k), ', ' order by k)
    into v_columns, v_select_columns
    from jsonb_object_keys(v_values) k;

    execute format(
      'insert into public.%I as target (%s) '
      || 'select %s from jsonb_populate_record(null::public.%I, $1) src '
      || 'returning to_jsonb(target)',
      p_table_name, v_columns, v_select_columns, p_table_name
    )
    using v_values
    into v_after;

  elsif v_operation = 'update' then
    select string_agg(format('%I = src.%I', k, k), ', ' order by k)
    into v_set_clause
    from jsonb_object_keys(v_values) k;

    execute format(
      'update public.%I as target set %s '
      || 'from jsonb_populate_record(null::public.%I, $1) src, '
      || 'jsonb_populate_record(null::public.%I, $2) keyrow '
      || 'where %s returning to_jsonb(target)',
      p_table_name, v_set_clause, p_table_name, p_table_name, v_key_predicate
    )
    using v_values, v_key
    into v_after;

    if v_after is null then
      raise exception 'The row was not updated.';
    end if;

  else
    execute format(
      'delete from public.%I as target '
      || 'using jsonb_populate_record(null::public.%I, $1) keyrow '
      || 'where %s returning to_jsonb(target)',
      p_table_name, p_table_name, v_key_predicate
    )
    using v_key
    into v_before;

    v_after := null;
  end if;

  perform private._log_data_studio_mutation(
    p_org_id,
    v_user_id,
    p_client_id,
    p_table_name,
    v_operation,
    case when v_operation = 'insert' then '{}'::jsonb else v_key end,
    case when v_operation = 'insert' then null else v_before end,
    case when v_operation = 'delete' then null else v_after end
  );

  return jsonb_build_object(
    'operation', v_operation,
    'tableName', p_table_name,
    'before', case when v_operation = 'insert' then null else v_before end,
    'after', case when v_operation = 'delete' then null else v_after end
  );
end;
$_$;

--
-- Name: run_sql_editor_query(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.run_sql_editor_query(query text) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO 'public'
    SET statement_timeout TO '5s'
    AS $$
declare
  v_org_id uuid;
  v_role public.org_role;
  v_trimmed text;
  v_result jsonb;
  v_row_count integer;
  v_start timestamptz := clock_timestamp();
  v_duration_ms integer;
  v_error text;
begin
  select org_id, role into v_org_id, v_role
  from public.org_members
  where user_id = auth.uid()
  order by created_at asc
  limit 1;

  if v_org_id is null then
    raise exception 'Not a member of any organization.';
  end if;

  if v_role not in ('owner', 'admin') then
    raise exception 'The SQL editor is limited to organization owners and admins.';
  end if;

  v_trimmed := btrim(query);

  if right(v_trimmed, 1) = ';' then
    v_trimmed := btrim(left(v_trimmed, length(v_trimmed) - 1));
  end if;

  if v_trimmed = '' then
    raise exception 'Enter a query to run.';
  end if;

  if position(';' in v_trimmed) > 0 then
    raise exception 'Only a single statement is allowed.';
  end if;

  if v_trimmed !~* '^(select|with)\y' then
    raise exception 'Only SELECT queries are allowed.';
  end if;

  if v_trimmed ~* '\y(insert|update|delete|drop|alter|truncate|grant|revoke|create|copy|vacuum|call|execute|do|merge|refresh|reindex|comment|lock|listen|notify|unlisten|set|reset|begin|commit|rollback|savepoint|prepare|deallocate|into|for\s+update|for\s+share|for\s+no\s+key\s+update|for\s+key\s+share)\y' then
    raise exception 'Query contains a disallowed keyword. Only plain SELECT reads are permitted.';
  end if;

  begin
    -- The user's query is wrapped as a derived table (never spliced with a
    -- trailing LIMIT), so a query that already ends in its own LIMIT/ORDER
    -- BY still parses; the outer LIMIT is what actually caps the result set.
    execute format(
      'select coalesce(jsonb_agg(row_to_json(sql_editor_row)), ''[]''::jsonb) from (select * from (%s) as sql_editor_query limit 500) as sql_editor_row',
      v_trimmed
    ) into v_result;
  exception when others then
    get stacked diagnostics v_error = message_text;
    v_duration_ms := extract(milliseconds from clock_timestamp() - v_start)::integer;
    perform public._log_sql_editor_query(
      v_org_id, auth.uid(), v_trimmed, null, 'error', v_error, v_duration_ms
    );
    raise;
  end;

  v_row_count := jsonb_array_length(v_result);
  v_duration_ms := extract(milliseconds from clock_timestamp() - v_start)::integer;

  perform public._log_sql_editor_query(
    v_org_id, auth.uid(), v_trimmed, v_row_count, 'success', null, v_duration_ms
  );

  return v_result;
end;
$$;

--
-- Name: agent_autonomy_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_autonomy_settings (
    org_id uuid NOT NULL,
    autonomy_level text DEFAULT 'full_autonomy'::text NOT NULL,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT agent_autonomy_settings_autonomy_level_check CHECK ((autonomy_level = ANY (ARRAY['full_autonomy'::text, 'require_approval'::text])))
);

--
-- Name: client_contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_contracts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    client_id uuid NOT NULL,
    name text NOT NULL,
    status public.contract_status DEFAULT 'draft'::public.contract_status NOT NULL,
    start_date date,
    end_date date,
    value numeric(12,2),
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    signing_token uuid DEFAULT gen_random_uuid() NOT NULL,
    approved_at timestamp with time zone,
    approved_by uuid,
    sent_at timestamp with time zone,
    signed_at timestamp with time zone,
    signer_name text,
    signer_email text,
    signed_by_name text,
    signer_ip text,
    reminder_count integer DEFAULT 0 NOT NULL,
    last_reminder_at timestamp with time zone,
    client_address text,
    services_description text,
    hourly_rate numeric(10,2),
    contract_number text DEFAULT ('CTR-'::text || upper(substr((gen_random_uuid())::text, 1, 8))) NOT NULL,
    agreement_number text NOT NULL,
    CONSTRAINT client_contracts_agreement_number_format CHECK ((agreement_number ~ '^AGR-[0-9]{6,}$'::text))
);

--
-- Name: COLUMN client_contracts.agreement_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.client_contracts.agreement_number IS 'System-generated business-facing Agreement ID. UUID primary key and legacy contract_number remain unchanged.';

--
-- Name: agreement_business_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agreement_business_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: agreement_business_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agreement_business_id_seq OWNED BY public.client_contracts.agreement_number;

--
-- Name: agreement_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agreement_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    name text NOT NULL,
    body text DEFAULT ''::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    name text NOT NULL,
    key_prefix text NOT NULL,
    key_hash text NOT NULL,
    last_used_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone
);

--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    excerpt text DEFAULT ''::text NOT NULL,
    body text DEFAULT ''::text NOT NULL,
    category text DEFAULT 'General'::text NOT NULL,
    author_name text DEFAULT ''::text NOT NULL,
    published boolean DEFAULT false NOT NULL,
    published_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: brief_download_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brief_download_leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    source text DEFAULT 'executive-brief'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    name text NOT NULL,
    status public.client_status DEFAULT 'active'::public.client_status NOT NULL,
    primary_contact_name text,
    primary_contact_email text,
    primary_contact_phone text,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    onboarding_stage public.onboarding_stage DEFAULT 'not_started'::public.onboarding_stage NOT NULL,
    billing_contact_name text,
    billing_contact_email text,
    billing_contact_phone text,
    momentum_billing_contact_name text,
    momentum_billing_contact_email text,
    payment_terms text,
    payment_method text,
    compliance_frameworks text[] DEFAULT '{}'::text[] NOT NULL,
    hipaa_covered_entity boolean DEFAULT false NOT NULL,
    compliance_notes text,
    project_manager_id uuid,
    client_number text NOT NULL,
    CONSTRAINT clients_client_number_format CHECK ((client_number ~ '^CLI-[0-9]{6,}$'::text))
);

--
-- Name: COLUMN clients.client_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clients.client_number IS 'System-generated business-facing Client ID. UUID primary key remains the internal relational identifier.';

--
-- Name: client_business_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.client_business_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: client_business_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.client_business_id_seq OWNED BY public.clients.client_number;

--
-- Name: client_portal_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    client_id uuid NOT NULL,
    email text NOT NULL,
    token uuid DEFAULT gen_random_uuid() NOT NULL,
    invited_by uuid,
    expires_at timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    role public.client_portal_role DEFAULT 'client_user'::public.client_portal_role NOT NULL
);

--
-- Name: client_portal_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_users (
    id uuid NOT NULL,
    org_id uuid NOT NULL,
    client_id uuid NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    password_updated_at timestamp with time zone DEFAULT now() NOT NULL,
    role public.client_portal_role DEFAULT 'client_user'::public.client_portal_role NOT NULL
);

--
-- Name: data_sensitivity_labels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_sensitivity_labels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    table_name text NOT NULL,
    column_name text,
    label public.data_sensitivity_label NOT NULL,
    compliance_frameworks text[] DEFAULT '{}'::text[] NOT NULL,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: data_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_sources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    name text NOT NULL,
    type public.data_source_type NOT NULL,
    status public.data_source_status DEFAULT 'pending'::public.data_source_status NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    secret_ref text,
    last_synced_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id uuid
);

--
-- Name: data_studio_mutation_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_studio_mutation_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid,
    table_name text NOT NULL,
    operation text NOT NULL,
    key_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    before_data jsonb,
    after_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT data_studio_mutation_log_operation_check CHECK ((operation = ANY (ARRAY['insert'::text, 'update'::text, 'delete'::text])))
);

--
-- Name: data_studio_table_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_studio_table_config (
    table_name text NOT NULL,
    label text NOT NULL,
    primary_key_columns text[] DEFAULT ARRAY['id'::text] NOT NULL,
    org_scope_column text,
    client_scope_column text,
    allow_read boolean DEFAULT true NOT NULL,
    allow_insert boolean DEFAULT false NOT NULL,
    allow_update boolean DEFAULT false NOT NULL,
    allow_delete boolean DEFAULT false NOT NULL,
    protected_columns text[] DEFAULT ARRAY['id'::text, 'org_id'::text, 'created_by'::text, 'created_at'::text, 'updated_at'::text] NOT NULL,
    sort_order integer DEFAULT 100 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: doc_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doc_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    name text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: docs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.docs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    body text DEFAULT ''::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    category text DEFAULT 'General'::text NOT NULL
);

--
-- Name: enhancement_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enhancement_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    notes text,
    status public.enhancement_task_status DEFAULT 'backlog'::public.enhancement_task_status NOT NULL,
    priority public.enhancement_task_priority DEFAULT 'medium'::public.enhancement_task_priority NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    assignee text,
    due_date date
);

--
-- Name: invoice_line_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_line_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    org_id uuid NOT NULL,
    description text NOT NULL,
    quantity numeric(10,2) DEFAULT 1 NOT NULL,
    unit_price numeric(12,2) DEFAULT 0 NOT NULL,
    amount numeric(12,2) DEFAULT 0 NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    client_id uuid NOT NULL,
    contract_id uuid,
    timecard_id uuid,
    invoice_number text NOT NULL,
    status public.invoice_status DEFAULT 'draft'::public.invoice_status NOT NULL,
    issue_date date DEFAULT CURRENT_DATE NOT NULL,
    due_date date,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    notes text,
    billing_contact_name text,
    billing_contact_email text,
    sent_at timestamp with time zone,
    paid_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: jaren_agent_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jaren_agent_settings (
    org_id uuid NOT NULL,
    essential_skills text[] DEFAULT ARRAY['data-extraction'::text, 'data-modeling'::text, 'data-automation'::text, 'design-aesthetics'::text, 'excel-workbooks'::text, 'power-bi'::text, 'sql'::text] NOT NULL,
    enhanced_skills text[] DEFAULT ARRAY['coding'::text, 'field-mapping'::text, 'business-operations'::text, 'application-design'::text, 'analytics'::text, 'data-innovation'::text, 'technology-innovation'::text, 'tool-engineering'::text] NOT NULL,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: jaren_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jaren_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    user_id uuid NOT NULL,
    title text DEFAULT 'New conversation'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT jaren_conversations_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text])))
);

--
-- Name: jaren_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jaren_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT jaren_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);

--
-- Name: org_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.org_invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    email text NOT NULL,
    role public.org_role DEFAULT 'member'::public.org_role NOT NULL,
    token uuid DEFAULT gen_random_uuid() NOT NULL,
    invited_by uuid,
    expires_at timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: org_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.org_members (
    org_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.org_role DEFAULT 'member'::public.org_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: pipeline_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pipeline_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pipeline_id uuid NOT NULL,
    org_id uuid NOT NULL,
    status public.pipeline_run_status DEFAULT 'queued'::public.pipeline_run_status NOT NULL,
    records_extracted integer DEFAULT 0 NOT NULL,
    records_loaded integer DEFAULT 0 NOT NULL,
    records_failed integer DEFAULT 0 NOT NULL,
    error text,
    triggered_by text DEFAULT 'manual'::text NOT NULL,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    run_number text DEFAULT ('RUN-'::text || upper(substr((gen_random_uuid())::text, 1, 8))) NOT NULL,
    sample_records jsonb DEFAULT '[]'::jsonb NOT NULL,
    loaded_records jsonb DEFAULT '[]'::jsonb NOT NULL,
    rolled_back_at timestamp with time zone,
    rolled_back_by uuid
);

--
-- Name: pipelines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pipelines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    name text NOT NULL,
    source_id uuid NOT NULL,
    destination_id uuid,
    mapping jsonb DEFAULT '[]'::jsonb NOT NULL,
    transform_steps jsonb DEFAULT '[]'::jsonb NOT NULL,
    schedule text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    password_updated_at timestamp with time zone DEFAULT now() NOT NULL,
    title text,
    description text,
    is_agent boolean DEFAULT false NOT NULL
);

--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    client_id uuid NOT NULL,
    name text NOT NULL,
    project_code text NOT NULL,
    status text DEFAULT 'intake'::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT projects_status_check CHECK ((status = ANY (ARRAY['intake'::text, 'in_progress'::text, 'client_review'::text, 'complete'::text])))
);

--
-- Name: security_findings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_findings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    rule_id uuid,
    category public.security_rule_category NOT NULL,
    severity public.security_severity DEFAULT 'medium'::public.security_severity NOT NULL,
    summary text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    actor_user_id uuid,
    status public.security_finding_status DEFAULT 'open'::public.security_finding_status NOT NULL,
    detected_by uuid,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    resolution_note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: security_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    category public.security_rule_category NOT NULL,
    resource text DEFAULT '*'::text NOT NULL,
    action text DEFAULT '*'::text NOT NULL,
    condition jsonb DEFAULT '{}'::jsonb NOT NULL,
    effect public.security_rule_effect DEFAULT 'alert'::public.security_rule_effect NOT NULL,
    severity public.security_severity DEFAULT 'medium'::public.security_severity NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: signup_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signup_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    company_name text,
    status public.signup_request_status DEFAULT 'pending'::public.signup_request_status NOT NULL,
    decided_at timestamp with time zone,
    decided_by uuid,
    decision_org_id uuid,
    decision_role public.org_role,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: sql_editor_query_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sql_editor_query_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    user_id uuid NOT NULL,
    query text NOT NULL,
    row_count integer,
    status text NOT NULL,
    error_message text,
    duration_ms integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sql_editor_query_log_status_check CHECK ((status = ANY (ARRAY['success'::text, 'error'::text])))
);

--
-- Name: time_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    client_id uuid NOT NULL,
    project_id uuid NOT NULL,
    contract_id uuid,
    work_date date DEFAULT CURRENT_DATE NOT NULL,
    hours numeric(6,2) NOT NULL,
    description text,
    billable boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    timecard_id uuid,
    CONSTRAINT time_entries_hours_check CHECK ((hours > (0)::numeric))
);

--
-- Name: timecards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.timecards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    client_id uuid NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    status public.timecard_status DEFAULT 'draft'::public.timecard_status NOT NULL,
    total_hours numeric(8,2) DEFAULT 0 NOT NULL,
    total_amount numeric(12,2),
    internal_approval_id text,
    internal_approved_at timestamp with time zone,
    internal_approved_by uuid,
    approval_token uuid DEFAULT gen_random_uuid() NOT NULL,
    approver_name text,
    approver_email text,
    sent_at timestamp with time zone,
    client_approved_at timestamp with time zone,
    client_approved_by_name text,
    client_rejected_at timestamp with time zone,
    rejection_reason text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    timecard_number text DEFAULT ('TC-'::text || upper(substr((gen_random_uuid())::text, 1, 8))) NOT NULL
);

--
-- Name: webhook_deliveries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_deliveries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    webhook_id uuid NOT NULL,
    org_id uuid NOT NULL,
    event text NOT NULL,
    direction public.webhook_direction NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    response_status integer,
    success boolean DEFAULT false NOT NULL,
    error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: webhooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhooks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    direction public.webhook_direction NOT NULL,
    name text NOT NULL,
    target_url text,
    events text[] DEFAULT '{}'::text[] NOT NULL,
    data_source_id uuid,
    inbound_token text,
    secret text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: workflow_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_definitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: workflow_instance_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_instance_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    workflow_instance_id uuid NOT NULL,
    from_stage_id uuid,
    to_stage_id uuid,
    note text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: workflow_instances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_instances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    workflow_definition_id uuid NOT NULL,
    current_stage_id uuid,
    title text NOT NULL,
    subject_type text,
    subject_id uuid,
    status public.workflow_instance_status DEFAULT 'active'::public.workflow_instance_status NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone
);

--
-- Name: workflow_stages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_stages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    workflow_definition_id uuid NOT NULL,
    name text NOT NULL,
    "position" integer NOT NULL,
    sla_hours integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: workflow_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    workflow_instance_id uuid NOT NULL,
    stage_id uuid,
    title text NOT NULL,
    description text,
    assignee_id uuid,
    status public.workflow_task_status DEFAULT 'pending'::public.workflow_task_status NOT NULL,
    due_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: client_contracts agreement_number; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_contracts ALTER COLUMN agreement_number SET DEFAULT ('AGR-'::text || lpad((nextval('public.agreement_business_id_seq'::regclass))::text, 6, '0'::text));

--
-- Name: clients client_number; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients ALTER COLUMN client_number SET DEFAULT ('CLI-'::text || lpad((nextval('public.client_business_id_seq'::regclass))::text, 6, '0'::text));

--
-- Name: agent_autonomy_settings agent_autonomy_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_autonomy_settings
    ADD CONSTRAINT agent_autonomy_settings_pkey PRIMARY KEY (org_id);

--
-- Name: agreement_templates agreement_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agreement_templates
    ADD CONSTRAINT agreement_templates_pkey PRIMARY KEY (id);

--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);

--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);

--
-- Name: brief_download_leads brief_download_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brief_download_leads
    ADD CONSTRAINT brief_download_leads_pkey PRIMARY KEY (id);

--
-- Name: client_contracts client_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_contracts
    ADD CONSTRAINT client_contracts_pkey PRIMARY KEY (id);

--
-- Name: client_portal_invites client_portal_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_invites
    ADD CONSTRAINT client_portal_invites_pkey PRIMARY KEY (id);

--
-- Name: client_portal_users client_portal_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_users
    ADD CONSTRAINT client_portal_users_pkey PRIMARY KEY (id);

--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);

--
-- Name: data_sensitivity_labels data_sensitivity_labels_org_id_table_name_column_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_sensitivity_labels
    ADD CONSTRAINT data_sensitivity_labels_org_id_table_name_column_name_key UNIQUE (org_id, table_name, column_name);

--
-- Name: data_sensitivity_labels data_sensitivity_labels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_sensitivity_labels
    ADD CONSTRAINT data_sensitivity_labels_pkey PRIMARY KEY (id);

--
-- Name: data_sources data_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_sources
    ADD CONSTRAINT data_sources_pkey PRIMARY KEY (id);

--
-- Name: data_studio_mutation_log data_studio_mutation_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_studio_mutation_log
    ADD CONSTRAINT data_studio_mutation_log_pkey PRIMARY KEY (id);

--
-- Name: data_studio_table_config data_studio_table_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_studio_table_config
    ADD CONSTRAINT data_studio_table_config_pkey PRIMARY KEY (table_name);

--
-- Name: doc_categories doc_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doc_categories
    ADD CONSTRAINT doc_categories_pkey PRIMARY KEY (id);

--
-- Name: docs docs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.docs
    ADD CONSTRAINT docs_pkey PRIMARY KEY (id);

--
-- Name: enhancement_tasks enhancement_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enhancement_tasks
    ADD CONSTRAINT enhancement_tasks_pkey PRIMARY KEY (id);

--
-- Name: invoice_line_items invoice_line_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line_items
    ADD CONSTRAINT invoice_line_items_pkey PRIMARY KEY (id);

--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);

--
-- Name: jaren_agent_settings jaren_agent_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jaren_agent_settings
    ADD CONSTRAINT jaren_agent_settings_pkey PRIMARY KEY (org_id);

--
-- Name: jaren_conversations jaren_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jaren_conversations
    ADD CONSTRAINT jaren_conversations_pkey PRIMARY KEY (id);

--
-- Name: jaren_messages jaren_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jaren_messages
    ADD CONSTRAINT jaren_messages_pkey PRIMARY KEY (id);

--
-- Name: org_invites org_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_invites
    ADD CONSTRAINT org_invites_pkey PRIMARY KEY (id);

--
-- Name: org_members org_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_members
    ADD CONSTRAINT org_members_pkey PRIMARY KEY (org_id, user_id);

--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);

--
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);

--
-- Name: pipeline_runs pipeline_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_runs
    ADD CONSTRAINT pipeline_runs_pkey PRIMARY KEY (id);

--
-- Name: pipelines pipelines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT pipelines_pkey PRIMARY KEY (id);

--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);

--
-- Name: security_findings security_findings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_findings
    ADD CONSTRAINT security_findings_pkey PRIMARY KEY (id);

--
-- Name: security_rules security_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_rules
    ADD CONSTRAINT security_rules_pkey PRIMARY KEY (id);

--
-- Name: signup_requests signup_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signup_requests
    ADD CONSTRAINT signup_requests_pkey PRIMARY KEY (id);

--
-- Name: signup_requests signup_requests_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signup_requests
    ADD CONSTRAINT signup_requests_user_id_key UNIQUE (user_id);

--
-- Name: sql_editor_query_log sql_editor_query_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sql_editor_query_log
    ADD CONSTRAINT sql_editor_query_log_pkey PRIMARY KEY (id);

--
-- Name: time_entries time_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_pkey PRIMARY KEY (id);

--
-- Name: timecards timecards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timecards
    ADD CONSTRAINT timecards_pkey PRIMARY KEY (id);

--
-- Name: webhook_deliveries webhook_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_pkey PRIMARY KEY (id);

--
-- Name: webhooks webhooks_inbound_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_inbound_token_key UNIQUE (inbound_token);

--
-- Name: webhooks webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_pkey PRIMARY KEY (id);

--
-- Name: workflow_definitions workflow_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_definitions
    ADD CONSTRAINT workflow_definitions_pkey PRIMARY KEY (id);

--
-- Name: workflow_instance_events workflow_instance_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_instance_events
    ADD CONSTRAINT workflow_instance_events_pkey PRIMARY KEY (id);

--
-- Name: workflow_instances workflow_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT workflow_instances_pkey PRIMARY KEY (id);

--
-- Name: workflow_stages workflow_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_stages
    ADD CONSTRAINT workflow_stages_pkey PRIMARY KEY (id);

--
-- Name: workflow_tasks workflow_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_tasks
    ADD CONSTRAINT workflow_tasks_pkey PRIMARY KEY (id);

--
-- Name: agreement_templates_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agreement_templates_org_id_idx ON public.agreement_templates USING btree (org_id);

--
-- Name: api_keys_key_hash_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX api_keys_key_hash_idx ON public.api_keys USING btree (key_hash);

--
-- Name: api_keys_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX api_keys_org_id_idx ON public.api_keys USING btree (org_id);

--
-- Name: blog_posts_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX blog_posts_org_id_idx ON public.blog_posts USING btree (org_id);

--
-- Name: blog_posts_org_id_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX blog_posts_org_id_slug_idx ON public.blog_posts USING btree (org_id, slug);

--
-- Name: blog_posts_published_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX blog_posts_published_idx ON public.blog_posts USING btree (published, published_at DESC);

--
-- Name: brief_download_leads_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX brief_download_leads_email_idx ON public.brief_download_leads USING btree (lower(email));

--
-- Name: client_contracts_agreement_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX client_contracts_agreement_number_key ON public.client_contracts USING btree (agreement_number);

--
-- Name: client_contracts_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_contracts_client_id_idx ON public.client_contracts USING btree (client_id, created_at DESC);

--
-- Name: client_contracts_contract_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX client_contracts_contract_number_idx ON public.client_contracts USING btree (org_id, contract_number);

--
-- Name: client_contracts_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_contracts_org_id_idx ON public.client_contracts USING btree (org_id);

--
-- Name: client_contracts_signing_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX client_contracts_signing_token_idx ON public.client_contracts USING btree (signing_token);

--
-- Name: client_portal_invites_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_invites_client_id_idx ON public.client_portal_invites USING btree (client_id, created_at DESC);

--
-- Name: client_portal_invites_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX client_portal_invites_token_idx ON public.client_portal_invites USING btree (token);

--
-- Name: client_portal_users_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_users_client_id_idx ON public.client_portal_users USING btree (client_id);

--
-- Name: client_portal_users_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_users_org_id_idx ON public.client_portal_users USING btree (org_id);

--
-- Name: clients_client_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clients_client_number_key ON public.clients USING btree (client_number);

--
-- Name: clients_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clients_org_id_idx ON public.clients USING btree (org_id);

--
-- Name: clients_project_manager_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clients_project_manager_id_idx ON public.clients USING btree (project_manager_id);

--
-- Name: data_sources_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX data_sources_client_id_idx ON public.data_sources USING btree (client_id);

--
-- Name: data_sources_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX data_sources_org_id_idx ON public.data_sources USING btree (org_id);

--
-- Name: data_studio_mutation_log_org_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX data_studio_mutation_log_org_created_idx ON public.data_studio_mutation_log USING btree (org_id, created_at DESC);

--
-- Name: data_studio_mutation_log_table_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX data_studio_mutation_log_table_created_idx ON public.data_studio_mutation_log USING btree (table_name, created_at DESC);

--
-- Name: doc_categories_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX doc_categories_org_id_idx ON public.doc_categories USING btree (org_id, name);

--
-- Name: doc_categories_org_id_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX doc_categories_org_id_name_idx ON public.doc_categories USING btree (org_id, lower(name));

--
-- Name: docs_org_id_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX docs_org_id_category_idx ON public.docs USING btree (org_id, category);

--
-- Name: docs_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX docs_org_id_idx ON public.docs USING btree (org_id);

--
-- Name: docs_org_id_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX docs_org_id_slug_idx ON public.docs USING btree (org_id, slug);

--
-- Name: enhancement_tasks_due_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX enhancement_tasks_due_date_idx ON public.enhancement_tasks USING btree (org_id, due_date) WHERE (due_date IS NOT NULL);

--
-- Name: enhancement_tasks_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX enhancement_tasks_org_id_idx ON public.enhancement_tasks USING btree (org_id, status, created_at DESC);

--
-- Name: invoice_line_items_invoice_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoice_line_items_invoice_id_idx ON public.invoice_line_items USING btree (invoice_id, sort_order);

--
-- Name: invoices_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoices_client_id_idx ON public.invoices USING btree (client_id, created_at DESC);

--
-- Name: invoices_contract_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoices_contract_id_idx ON public.invoices USING btree (contract_id);

--
-- Name: invoices_org_id_invoice_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX invoices_org_id_invoice_number_idx ON public.invoices USING btree (org_id, invoice_number);

--
-- Name: invoices_timecard_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoices_timecard_id_idx ON public.invoices USING btree (timecard_id);

--
-- Name: jaren_conversations_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jaren_conversations_user_id_idx ON public.jaren_conversations USING btree (user_id, updated_at DESC);

--
-- Name: jaren_messages_conversation_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jaren_messages_conversation_id_idx ON public.jaren_messages USING btree (conversation_id, created_at);

--
-- Name: org_invites_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX org_invites_org_id_idx ON public.org_invites USING btree (org_id, created_at DESC);

--
-- Name: org_invites_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX org_invites_token_idx ON public.org_invites USING btree (token);

--
-- Name: org_members_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX org_members_user_id_idx ON public.org_members USING btree (user_id);

--
-- Name: pipeline_runs_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pipeline_runs_org_id_idx ON public.pipeline_runs USING btree (org_id);

--
-- Name: pipeline_runs_pipeline_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pipeline_runs_pipeline_id_idx ON public.pipeline_runs USING btree (pipeline_id, created_at DESC);

--
-- Name: pipeline_runs_run_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pipeline_runs_run_number_idx ON public.pipeline_runs USING btree (org_id, run_number);

--
-- Name: pipelines_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pipelines_org_id_idx ON public.pipelines USING btree (org_id);

--
-- Name: projects_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX projects_client_id_idx ON public.projects USING btree (client_id);

--
-- Name: projects_org_id_project_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX projects_org_id_project_code_idx ON public.projects USING btree (org_id, project_code);

--
-- Name: security_findings_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX security_findings_org_id_idx ON public.security_findings USING btree (org_id, status, created_at DESC);

--
-- Name: security_rules_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX security_rules_org_id_idx ON public.security_rules USING btree (org_id, category, is_active);

--
-- Name: signup_requests_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX signup_requests_status_idx ON public.signup_requests USING btree (status, created_at DESC);

--
-- Name: sql_editor_query_log_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sql_editor_query_log_org_id_idx ON public.sql_editor_query_log USING btree (org_id, created_at DESC);

--
-- Name: time_entries_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX time_entries_client_id_idx ON public.time_entries USING btree (client_id, work_date DESC);

--
-- Name: time_entries_contract_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX time_entries_contract_id_idx ON public.time_entries USING btree (contract_id);

--
-- Name: time_entries_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX time_entries_org_id_idx ON public.time_entries USING btree (org_id);

--
-- Name: time_entries_project_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX time_entries_project_id_idx ON public.time_entries USING btree (project_id);

--
-- Name: time_entries_timecard_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX time_entries_timecard_id_idx ON public.time_entries USING btree (timecard_id);

--
-- Name: timecards_approval_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX timecards_approval_token_idx ON public.timecards USING btree (approval_token);

--
-- Name: timecards_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX timecards_client_id_idx ON public.timecards USING btree (client_id, created_at DESC);

--
-- Name: timecards_timecard_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX timecards_timecard_number_idx ON public.timecards USING btree (org_id, timecard_number);

--
-- Name: webhook_deliveries_webhook_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX webhook_deliveries_webhook_id_idx ON public.webhook_deliveries USING btree (webhook_id, created_at DESC);

--
-- Name: webhooks_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX webhooks_org_id_idx ON public.webhooks USING btree (org_id);

--
-- Name: workflow_definitions_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workflow_definitions_org_id_idx ON public.workflow_definitions USING btree (org_id);

--
-- Name: workflow_instance_events_instance_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workflow_instance_events_instance_id_idx ON public.workflow_instance_events USING btree (workflow_instance_id);

--
-- Name: workflow_instance_events_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workflow_instance_events_org_id_idx ON public.workflow_instance_events USING btree (org_id);

--
-- Name: workflow_instances_current_stage_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workflow_instances_current_stage_idx ON public.workflow_instances USING btree (current_stage_id);

--
-- Name: workflow_instances_definition_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workflow_instances_definition_id_idx ON public.workflow_instances USING btree (workflow_definition_id);

--
-- Name: workflow_instances_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workflow_instances_org_id_idx ON public.workflow_instances USING btree (org_id);

--
-- Name: workflow_instances_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workflow_instances_status_idx ON public.workflow_instances USING btree (status);

--
-- Name: workflow_stages_definition_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workflow_stages_definition_id_idx ON public.workflow_stages USING btree (workflow_definition_id);

--
-- Name: workflow_stages_definition_position_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX workflow_stages_definition_position_idx ON public.workflow_stages USING btree (workflow_definition_id, "position");

--
-- Name: workflow_stages_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workflow_stages_org_id_idx ON public.workflow_stages USING btree (org_id);

--
-- Name: workflow_tasks_assignee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workflow_tasks_assignee_idx ON public.workflow_tasks USING btree (assignee_id);

--
-- Name: workflow_tasks_instance_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workflow_tasks_instance_id_idx ON public.workflow_tasks USING btree (workflow_instance_id);

--
-- Name: workflow_tasks_org_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workflow_tasks_org_id_idx ON public.workflow_tasks USING btree (org_id);

--
-- Name: workflow_tasks_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workflow_tasks_status_idx ON public.workflow_tasks USING btree (status);

--
-- Name: agent_autonomy_settings agent_autonomy_settings_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_autonomy_settings
    ADD CONSTRAINT agent_autonomy_settings_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: agent_autonomy_settings agent_autonomy_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_autonomy_settings
    ADD CONSTRAINT agent_autonomy_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: agreement_templates agreement_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agreement_templates
    ADD CONSTRAINT agreement_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: agreement_templates agreement_templates_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agreement_templates
    ADD CONSTRAINT agreement_templates_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: api_keys api_keys_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: api_keys api_keys_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: blog_posts blog_posts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: blog_posts blog_posts_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: client_contracts client_contracts_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_contracts
    ADD CONSTRAINT client_contracts_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: client_contracts client_contracts_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_contracts
    ADD CONSTRAINT client_contracts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

--
-- Name: client_contracts client_contracts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_contracts
    ADD CONSTRAINT client_contracts_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: client_contracts client_contracts_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_contracts
    ADD CONSTRAINT client_contracts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: client_portal_invites client_portal_invites_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_invites
    ADD CONSTRAINT client_portal_invites_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

--
-- Name: client_portal_invites client_portal_invites_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_invites
    ADD CONSTRAINT client_portal_invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: client_portal_invites client_portal_invites_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_invites
    ADD CONSTRAINT client_portal_invites_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: client_portal_users client_portal_users_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_users
    ADD CONSTRAINT client_portal_users_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

--
-- Name: client_portal_users client_portal_users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_users
    ADD CONSTRAINT client_portal_users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

--
-- Name: client_portal_users client_portal_users_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_users
    ADD CONSTRAINT client_portal_users_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: clients clients_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: clients clients_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: clients clients_project_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_project_manager_id_fkey FOREIGN KEY (project_manager_id) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: data_sensitivity_labels data_sensitivity_labels_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_sensitivity_labels
    ADD CONSTRAINT data_sensitivity_labels_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: data_sensitivity_labels data_sensitivity_labels_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_sensitivity_labels
    ADD CONSTRAINT data_sensitivity_labels_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: data_sources data_sources_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_sources
    ADD CONSTRAINT data_sources_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

--
-- Name: data_sources data_sources_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_sources
    ADD CONSTRAINT data_sources_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: data_sources data_sources_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_sources
    ADD CONSTRAINT data_sources_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: data_studio_mutation_log data_studio_mutation_log_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_studio_mutation_log
    ADD CONSTRAINT data_studio_mutation_log_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

--
-- Name: data_studio_mutation_log data_studio_mutation_log_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_studio_mutation_log
    ADD CONSTRAINT data_studio_mutation_log_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: data_studio_mutation_log data_studio_mutation_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_studio_mutation_log
    ADD CONSTRAINT data_studio_mutation_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

--
-- Name: doc_categories doc_categories_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doc_categories
    ADD CONSTRAINT doc_categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: doc_categories doc_categories_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doc_categories
    ADD CONSTRAINT doc_categories_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: docs docs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.docs
    ADD CONSTRAINT docs_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: docs docs_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.docs
    ADD CONSTRAINT docs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: enhancement_tasks enhancement_tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enhancement_tasks
    ADD CONSTRAINT enhancement_tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: enhancement_tasks enhancement_tasks_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enhancement_tasks
    ADD CONSTRAINT enhancement_tasks_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: invoice_line_items invoice_line_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line_items
    ADD CONSTRAINT invoice_line_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;

--
-- Name: invoice_line_items invoice_line_items_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line_items
    ADD CONSTRAINT invoice_line_items_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: invoices invoices_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

--
-- Name: invoices invoices_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.client_contracts(id) ON DELETE SET NULL;

--
-- Name: invoices invoices_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: invoices invoices_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: invoices invoices_timecard_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_timecard_id_fkey FOREIGN KEY (timecard_id) REFERENCES public.timecards(id) ON DELETE SET NULL;

--
-- Name: jaren_agent_settings jaren_agent_settings_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jaren_agent_settings
    ADD CONSTRAINT jaren_agent_settings_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: jaren_agent_settings jaren_agent_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jaren_agent_settings
    ADD CONSTRAINT jaren_agent_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: jaren_conversations jaren_conversations_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jaren_conversations
    ADD CONSTRAINT jaren_conversations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: jaren_conversations jaren_conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jaren_conversations
    ADD CONSTRAINT jaren_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

--
-- Name: jaren_messages jaren_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jaren_messages
    ADD CONSTRAINT jaren_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.jaren_conversations(id) ON DELETE CASCADE;

--
-- Name: org_invites org_invites_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_invites
    ADD CONSTRAINT org_invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: org_invites org_invites_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_invites
    ADD CONSTRAINT org_invites_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: org_members org_members_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_members
    ADD CONSTRAINT org_members_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: org_members org_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_members
    ADD CONSTRAINT org_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

--
-- Name: pipeline_runs pipeline_runs_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_runs
    ADD CONSTRAINT pipeline_runs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: pipeline_runs pipeline_runs_pipeline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_runs
    ADD CONSTRAINT pipeline_runs_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id) ON DELETE CASCADE;

--
-- Name: pipeline_runs pipeline_runs_rolled_back_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_runs
    ADD CONSTRAINT pipeline_runs_rolled_back_by_fkey FOREIGN KEY (rolled_back_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: pipelines pipelines_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT pipelines_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: pipelines pipelines_destination_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT pipelines_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.data_sources(id) ON DELETE SET NULL;

--
-- Name: pipelines pipelines_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT pipelines_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: pipelines pipelines_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT pipelines_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.data_sources(id) ON DELETE CASCADE;

--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

--
-- Name: projects projects_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

--
-- Name: projects projects_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: projects projects_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: security_findings security_findings_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_findings
    ADD CONSTRAINT security_findings_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: security_findings security_findings_detected_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_findings
    ADD CONSTRAINT security_findings_detected_by_fkey FOREIGN KEY (detected_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: security_findings security_findings_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_findings
    ADD CONSTRAINT security_findings_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: security_findings security_findings_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_findings
    ADD CONSTRAINT security_findings_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: security_findings security_findings_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_findings
    ADD CONSTRAINT security_findings_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.security_rules(id) ON DELETE SET NULL;

--
-- Name: security_rules security_rules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_rules
    ADD CONSTRAINT security_rules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: security_rules security_rules_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_rules
    ADD CONSTRAINT security_rules_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: signup_requests signup_requests_decided_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signup_requests
    ADD CONSTRAINT signup_requests_decided_by_fkey FOREIGN KEY (decided_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: signup_requests signup_requests_decision_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signup_requests
    ADD CONSTRAINT signup_requests_decision_org_id_fkey FOREIGN KEY (decision_org_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

--
-- Name: signup_requests signup_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signup_requests
    ADD CONSTRAINT signup_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

--
-- Name: sql_editor_query_log sql_editor_query_log_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sql_editor_query_log
    ADD CONSTRAINT sql_editor_query_log_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: sql_editor_query_log sql_editor_query_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sql_editor_query_log
    ADD CONSTRAINT sql_editor_query_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

--
-- Name: time_entries time_entries_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

--
-- Name: time_entries time_entries_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.client_contracts(id) ON DELETE SET NULL;

--
-- Name: time_entries time_entries_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: time_entries time_entries_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: time_entries time_entries_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

--
-- Name: time_entries time_entries_timecard_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_timecard_id_fkey FOREIGN KEY (timecard_id) REFERENCES public.timecards(id) ON DELETE SET NULL;

--
-- Name: timecards timecards_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timecards
    ADD CONSTRAINT timecards_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

--
-- Name: timecards timecards_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timecards
    ADD CONSTRAINT timecards_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: timecards timecards_internal_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timecards
    ADD CONSTRAINT timecards_internal_approved_by_fkey FOREIGN KEY (internal_approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: timecards timecards_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timecards
    ADD CONSTRAINT timecards_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: webhook_deliveries webhook_deliveries_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: webhook_deliveries webhook_deliveries_webhook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_webhook_id_fkey FOREIGN KEY (webhook_id) REFERENCES public.webhooks(id) ON DELETE CASCADE;

--
-- Name: webhooks webhooks_data_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_data_source_id_fkey FOREIGN KEY (data_source_id) REFERENCES public.data_sources(id) ON DELETE CASCADE;

--
-- Name: webhooks webhooks_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: workflow_definitions workflow_definitions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_definitions
    ADD CONSTRAINT workflow_definitions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: workflow_definitions workflow_definitions_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_definitions
    ADD CONSTRAINT workflow_definitions_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: workflow_instance_events workflow_instance_events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_instance_events
    ADD CONSTRAINT workflow_instance_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: workflow_instance_events workflow_instance_events_from_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_instance_events
    ADD CONSTRAINT workflow_instance_events_from_stage_id_fkey FOREIGN KEY (from_stage_id) REFERENCES public.workflow_stages(id) ON DELETE SET NULL;

--
-- Name: workflow_instance_events workflow_instance_events_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_instance_events
    ADD CONSTRAINT workflow_instance_events_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: workflow_instance_events workflow_instance_events_to_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_instance_events
    ADD CONSTRAINT workflow_instance_events_to_stage_id_fkey FOREIGN KEY (to_stage_id) REFERENCES public.workflow_stages(id) ON DELETE SET NULL;

--
-- Name: workflow_instance_events workflow_instance_events_workflow_instance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_instance_events
    ADD CONSTRAINT workflow_instance_events_workflow_instance_id_fkey FOREIGN KEY (workflow_instance_id) REFERENCES public.workflow_instances(id) ON DELETE CASCADE;

--
-- Name: workflow_instances workflow_instances_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT workflow_instances_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: workflow_instances workflow_instances_current_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT workflow_instances_current_stage_id_fkey FOREIGN KEY (current_stage_id) REFERENCES public.workflow_stages(id) ON DELETE SET NULL;

--
-- Name: workflow_instances workflow_instances_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT workflow_instances_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: workflow_instances workflow_instances_workflow_definition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT workflow_instances_workflow_definition_id_fkey FOREIGN KEY (workflow_definition_id) REFERENCES public.workflow_definitions(id) ON DELETE CASCADE;

--
-- Name: workflow_stages workflow_stages_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_stages
    ADD CONSTRAINT workflow_stages_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: workflow_stages workflow_stages_workflow_definition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_stages
    ADD CONSTRAINT workflow_stages_workflow_definition_id_fkey FOREIGN KEY (workflow_definition_id) REFERENCES public.workflow_definitions(id) ON DELETE CASCADE;

--
-- Name: workflow_tasks workflow_tasks_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_tasks
    ADD CONSTRAINT workflow_tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: workflow_tasks workflow_tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_tasks
    ADD CONSTRAINT workflow_tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

--
-- Name: workflow_tasks workflow_tasks_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_tasks
    ADD CONSTRAINT workflow_tasks_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

--
-- Name: workflow_tasks workflow_tasks_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_tasks
    ADD CONSTRAINT workflow_tasks_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.workflow_stages(id) ON DELETE SET NULL;

--
-- Name: workflow_tasks workflow_tasks_workflow_instance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_tasks
    ADD CONSTRAINT workflow_tasks_workflow_instance_id_fkey FOREIGN KEY (workflow_instance_id) REFERENCES public.workflow_instances(id) ON DELETE CASCADE;

--
-- Name: agent_autonomy_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agent_autonomy_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: agreement_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agreement_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: api_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: brief_download_leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.brief_download_leads ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles client portal users can view their assigned PM profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "client portal users can view their assigned PM profile" ON public.profiles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.clients c
     JOIN public.client_portal_users cpu ON ((cpu.client_id = c.id)))
  WHERE ((cpu.id = auth.uid()) AND (c.project_manager_id = profiles.id)))));

--
-- Name: client_contracts client users can view their contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "client users can view their contracts" ON public.client_contracts FOR SELECT USING (public.is_client_portal_user(client_id));

--
-- Name: data_sources client users can view their data sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "client users can view their data sources" ON public.data_sources FOR SELECT USING (((client_id IS NOT NULL) AND public.is_client_portal_user(client_id)));

--
-- Name: invoice_line_items client users can view their invoice line items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "client users can view their invoice line items" ON public.invoice_line_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.invoices i
  WHERE ((i.id = invoice_line_items.invoice_id) AND public.is_client_portal_user(i.client_id)))));

--
-- Name: invoices client users can view their invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "client users can view their invoices" ON public.invoices FOR SELECT USING (public.is_client_portal_user(client_id));

--
-- Name: clients client users can view their own client record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "client users can view their own client record" ON public.clients FOR SELECT USING (public.is_client_portal_user(id));

--
-- Name: client_portal_users client users can view their own membership; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "client users can view their own membership" ON public.client_portal_users FOR SELECT USING ((id = auth.uid()));

--
-- Name: pipeline_runs client users can view their pipeline runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "client users can view their pipeline runs" ON public.pipeline_runs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.pipelines p
     JOIN public.data_sources ds ON ((ds.id = p.source_id)))
  WHERE ((p.id = pipeline_runs.pipeline_id) AND (ds.client_id IS NOT NULL) AND public.is_client_portal_user(ds.client_id)))));

--
-- Name: pipelines client users can view their pipelines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "client users can view their pipelines" ON public.pipelines FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.data_sources ds
  WHERE ((ds.id = pipelines.source_id) AND (ds.client_id IS NOT NULL) AND public.is_client_portal_user(ds.client_id)))));

--
-- Name: projects client users can view their projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "client users can view their projects" ON public.projects FOR SELECT USING (public.is_client_portal_user(client_id));

--
-- Name: time_entries client users can view their time entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "client users can view their time entries" ON public.time_entries FOR SELECT USING (public.is_client_portal_user(client_id));

--
-- Name: timecards client users can view their timecards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "client users can view their timecards" ON public.timecards FOR SELECT USING (public.is_client_portal_user(client_id));

--
-- Name: client_contracts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_contracts ENABLE ROW LEVEL SECURITY;

--
-- Name: client_portal_invites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_portal_invites ENABLE ROW LEVEL SECURITY;

--
-- Name: client_portal_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_portal_users ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: data_sensitivity_labels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.data_sensitivity_labels ENABLE ROW LEVEL SECURITY;

--
-- Name: data_sources; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;

--
-- Name: data_studio_mutation_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.data_studio_mutation_log ENABLE ROW LEVEL SECURITY;

--
-- Name: data_studio_table_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.data_studio_table_config ENABLE ROW LEVEL SECURITY;

--
-- Name: doc_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.doc_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: docs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.docs ENABLE ROW LEVEL SECURITY;

--
-- Name: enhancement_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.enhancement_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: data_sensitivity_labels human org admins can change data sensitivity labels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "human org admins can change data sensitivity labels" ON public.data_sensitivity_labels FOR UPDATE USING (public.is_human_org_admin(org_id)) WITH CHECK (public.is_human_org_admin(org_id));

--
-- Name: security_rules human org admins can change security rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "human org admins can change security rules" ON public.security_rules FOR UPDATE USING (public.is_human_org_admin(org_id)) WITH CHECK (public.is_human_org_admin(org_id));

--
-- Name: agent_autonomy_settings human org admins can manage agent autonomy settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "human org admins can manage agent autonomy settings" ON public.agent_autonomy_settings USING ((EXISTS ( SELECT 1
   FROM public.org_members
  WHERE ((org_members.org_id = agent_autonomy_settings.org_id) AND (org_members.user_id = auth.uid()) AND (org_members.role = ANY (ARRAY['owner'::public.org_role, 'admin'::public.org_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.org_members
  WHERE ((org_members.org_id = agent_autonomy_settings.org_id) AND (org_members.user_id = auth.uid()) AND (org_members.role = ANY (ARRAY['owner'::public.org_role, 'admin'::public.org_role]))))));

--
-- Name: jaren_agent_settings human org admins can manage jaren agent settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "human org admins can manage jaren agent settings" ON public.jaren_agent_settings USING ((EXISTS ( SELECT 1
   FROM public.org_members
  WHERE ((org_members.org_id = jaren_agent_settings.org_id) AND (org_members.user_id = auth.uid()) AND (org_members.role = ANY (ARRAY['owner'::public.org_role, 'admin'::public.org_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.org_members
  WHERE ((org_members.org_id = jaren_agent_settings.org_id) AND (org_members.user_id = auth.uid()) AND (org_members.role = ANY (ARRAY['owner'::public.org_role, 'admin'::public.org_role]))))));

--
-- Name: data_sensitivity_labels human org admins can remove data sensitivity labels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "human org admins can remove data sensitivity labels" ON public.data_sensitivity_labels FOR DELETE USING (public.is_human_org_admin(org_id));

--
-- Name: security_rules human org admins can remove security rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "human org admins can remove security rules" ON public.security_rules FOR DELETE USING (public.is_human_org_admin(org_id));

--
-- Name: security_findings human org admins can update security findings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "human org admins can update security findings" ON public.security_findings FOR UPDATE USING (public.is_human_org_admin(org_id)) WITH CHECK (public.is_human_org_admin(org_id));

--
-- Name: invoice_line_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: jaren_agent_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.jaren_agent_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: jaren_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.jaren_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: jaren_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.jaren_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: signup_requests org admins can decide signup requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org admins can decide signup requests" ON public.signup_requests FOR UPDATE USING (public.is_any_org_admin()) WITH CHECK (public.is_any_org_admin());

--
-- Name: api_keys org admins can manage api keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org admins can manage api keys" ON public.api_keys USING (public.is_org_admin(org_id)) WITH CHECK (public.is_org_admin(org_id));

--
-- Name: client_portal_invites org admins can manage client portal invites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org admins can manage client portal invites" ON public.client_portal_invites USING (public.is_org_admin(org_id)) WITH CHECK (public.is_org_admin(org_id));

--
-- Name: client_portal_users org admins can manage client portal users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org admins can manage client portal users" ON public.client_portal_users USING (public.is_org_admin(org_id)) WITH CHECK (public.is_org_admin(org_id));

--
-- Name: org_invites org admins can manage invites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org admins can manage invites" ON public.org_invites USING (public.is_org_admin(org_id)) WITH CHECK (public.is_org_admin(org_id));

--
-- Name: org_members org admins can manage roster; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org admins can manage roster" ON public.org_members USING (public.is_org_admin(org_id)) WITH CHECK (public.is_org_admin(org_id));

--
-- Name: webhooks org admins can manage webhooks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org admins can manage webhooks" ON public.webhooks USING (public.is_org_admin(org_id)) WITH CHECK (public.is_org_admin(org_id));

--
-- Name: organizations org admins can update their organization; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org admins can update their organization" ON public.organizations FOR UPDATE USING (public.is_org_admin(id));

--
-- Name: data_studio_mutation_log org admins can view data studio mutation log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org admins can view data studio mutation log" ON public.data_studio_mutation_log FOR SELECT TO authenticated USING (public.is_org_admin(org_id));

--
-- Name: data_studio_table_config org admins can view data studio table config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org admins can view data studio table config" ON public.data_studio_table_config FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.org_members om
  WHERE ((om.user_id = auth.uid()) AND (om.role = ANY (ARRAY['owner'::public.org_role, 'admin'::public.org_role]))))));

--
-- Name: signup_requests org admins can view signup requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org admins can view signup requests" ON public.signup_requests FOR SELECT USING (public.is_any_org_admin());

--
-- Name: sql_editor_query_log org admins can view sql editor query log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org admins can view sql editor query log" ON public.sql_editor_query_log FOR SELECT USING (public.is_org_admin(org_id));

--
-- Name: security_rules org admins incl agents can propose security rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org admins incl agents can propose security rules" ON public.security_rules FOR INSERT WITH CHECK (public.is_org_admin(org_id));

--
-- Name: security_findings org admins incl agents can raise security findings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org admins incl agents can raise security findings" ON public.security_findings FOR INSERT WITH CHECK (public.is_org_admin(org_id));

--
-- Name: data_sensitivity_labels org admins incl agents can tag data sensitivity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org admins incl agents can tag data sensitivity" ON public.data_sensitivity_labels FOR INSERT WITH CHECK (public.is_org_admin(org_id));

--
-- Name: data_sensitivity_labels org admins incl agents can view data sensitivity labels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org admins incl agents can view data sensitivity labels" ON public.data_sensitivity_labels FOR SELECT USING (public.is_org_admin(org_id));

--
-- Name: security_findings org admins incl agents can view security findings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org admins incl agents can view security findings" ON public.security_findings FOR SELECT USING (public.is_org_admin(org_id));

--
-- Name: security_rules org admins incl agents can view security rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org admins incl agents can view security rules" ON public.security_rules FOR SELECT USING (public.is_org_admin(org_id));

--
-- Name: enhancement_tasks org members can create enhancement tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can create enhancement tasks" ON public.enhancement_tasks FOR INSERT WITH CHECK (public.is_org_member(org_id));

--
-- Name: enhancement_tasks org members can delete enhancement tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can delete enhancement tasks" ON public.enhancement_tasks FOR DELETE USING (public.is_org_member(org_id));

--
-- Name: pipeline_runs org members can insert pipeline runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can insert pipeline runs" ON public.pipeline_runs FOR INSERT WITH CHECK (public.is_org_member(org_id));

--
-- Name: agreement_templates org members can manage agreement templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can manage agreement templates" ON public.agreement_templates USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

--
-- Name: blog_posts org members can manage blog posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can manage blog posts" ON public.blog_posts USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

--
-- Name: client_contracts org members can manage client contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can manage client contracts" ON public.client_contracts USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

--
-- Name: clients org members can manage clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can manage clients" ON public.clients USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

--
-- Name: data_sources org members can manage data sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can manage data sources" ON public.data_sources USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

--
-- Name: doc_categories org members can manage doc categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can manage doc categories" ON public.doc_categories USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

--
-- Name: docs org members can manage docs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can manage docs" ON public.docs USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

--
-- Name: invoice_line_items org members can manage invoice line items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can manage invoice line items" ON public.invoice_line_items USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

--
-- Name: invoices org members can manage invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can manage invoices" ON public.invoices USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

--
-- Name: pipelines org members can manage pipelines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can manage pipelines" ON public.pipelines USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

--
-- Name: projects org members can manage projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can manage projects" ON public.projects USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

--
-- Name: time_entries org members can manage time entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can manage time entries" ON public.time_entries USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

--
-- Name: timecards org members can manage timecards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can manage timecards" ON public.timecards USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

--
-- Name: workflow_definitions org members can manage workflow definitions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can manage workflow definitions" ON public.workflow_definitions USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

--
-- Name: workflow_instance_events org members can manage workflow instance events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can manage workflow instance events" ON public.workflow_instance_events USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

--
-- Name: workflow_instances org members can manage workflow instances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can manage workflow instances" ON public.workflow_instances USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

--
-- Name: workflow_stages org members can manage workflow stages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can manage workflow stages" ON public.workflow_stages USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

--
-- Name: workflow_tasks org members can manage workflow tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can manage workflow tasks" ON public.workflow_tasks USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

--
-- Name: jaren_agent_settings org members can read jaren agent settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can read jaren agent settings" ON public.jaren_agent_settings FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.org_members
  WHERE ((org_members.org_id = jaren_agent_settings.org_id) AND (org_members.user_id = auth.uid())))));

--
-- Name: enhancement_tasks org members can update enhancement tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can update enhancement tasks" ON public.enhancement_tasks FOR UPDATE USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

--
-- Name: pipeline_runs org members can update pipeline runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can update pipeline runs" ON public.pipeline_runs FOR UPDATE USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));

--
-- Name: enhancement_tasks org members can view enhancement tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can view enhancement tasks" ON public.enhancement_tasks FOR SELECT USING (public.is_org_member(org_id));

--
-- Name: profiles org members can view org-mates profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can view org-mates profiles" ON public.profiles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.org_members om1
     JOIN public.org_members om2 ON ((om1.org_id = om2.org_id)))
  WHERE ((om1.user_id = auth.uid()) AND (om2.user_id = profiles.id)))));

--
-- Name: pipeline_runs org members can view pipeline runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can view pipeline runs" ON public.pipeline_runs FOR SELECT USING (public.is_org_member(org_id));

--
-- Name: org_members org members can view roster; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can view roster" ON public.org_members FOR SELECT USING (public.is_org_member(org_id));

--
-- Name: organizations org members can view their organizations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can view their organizations" ON public.organizations FOR SELECT USING (public.is_org_member(id));

--
-- Name: webhook_deliveries org members can view webhook deliveries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "org members can view webhook deliveries" ON public.webhook_deliveries FOR SELECT USING (public.is_org_member(org_id));

--
-- Name: org_invites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.org_invites ENABLE ROW LEVEL SECURITY;

--
-- Name: org_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: pipeline_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: pipelines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: security_findings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.security_findings ENABLE ROW LEVEL SECURITY;

--
-- Name: security_rules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.security_rules ENABLE ROW LEVEL SECURITY;

--
-- Name: signup_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.signup_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: sql_editor_query_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sql_editor_query_log ENABLE ROW LEVEL SECURITY;

--
-- Name: time_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: timecards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.timecards ENABLE ROW LEVEL SECURITY;

--
-- Name: jaren_messages users can manage messages in their own jaren conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users can manage messages in their own jaren conversations" ON public.jaren_messages USING ((EXISTS ( SELECT 1
   FROM public.jaren_conversations
  WHERE ((jaren_conversations.id = jaren_messages.conversation_id) AND (jaren_conversations.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.jaren_conversations
  WHERE ((jaren_conversations.id = jaren_messages.conversation_id) AND (jaren_conversations.user_id = auth.uid())))));

--
-- Name: jaren_conversations users can manage their own jaren conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users can manage their own jaren conversations" ON public.jaren_conversations USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

--
-- Name: profiles users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));

--
-- Name: profiles users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));

--
-- Name: webhook_deliveries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

--
-- Name: webhooks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

--
-- Name: workflow_definitions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;

--
-- Name: workflow_instance_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflow_instance_events ENABLE ROW LEVEL SECURITY;

--
-- Name: workflow_instances; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflow_instances ENABLE ROW LEVEL SECURITY;

--
-- Name: workflow_stages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflow_stages ENABLE ROW LEVEL SECURITY;

--
-- Name: workflow_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflow_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA private; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA private TO authenticated;

--
-- Name: FUNCTION _log_data_studio_mutation(p_org_id uuid, p_user_id uuid, p_client_id uuid, p_table_name text, p_operation text, p_key_data jsonb, p_before_data jsonb, p_after_data jsonb); Type: ACL; Schema: private; Owner: -
--

REVOKE ALL ON FUNCTION private._log_data_studio_mutation(p_org_id uuid, p_user_id uuid, p_client_id uuid, p_table_name text, p_operation text, p_key_data jsonb, p_before_data jsonb, p_after_data jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION private._log_data_studio_mutation(p_org_id uuid, p_user_id uuid, p_client_id uuid, p_table_name text, p_operation text, p_key_data jsonb, p_before_data jsonb, p_after_data jsonb) TO authenticated;

--
-- Name: FUNCTION _log_sql_editor_query(p_org_id uuid, p_user_id uuid, p_query text, p_row_count integer, p_status text, p_error_message text, p_duration_ms integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public._log_sql_editor_query(p_org_id uuid, p_user_id uuid, p_query text, p_row_count integer, p_status text, p_error_message text, p_duration_ms integer) FROM PUBLIC;

--
-- Name: FUNCTION get_data_studio_schema(p_org_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_data_studio_schema(p_org_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_data_studio_schema(p_org_id uuid) TO authenticated;

--
-- Name: FUNCTION run_data_studio_mutation(p_org_id uuid, p_table_name text, p_operation text, p_key jsonb, p_values jsonb, p_client_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.run_data_studio_mutation(p_org_id uuid, p_table_name text, p_operation text, p_key jsonb, p_values jsonb, p_client_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.run_data_studio_mutation(p_org_id uuid, p_table_name text, p_operation text, p_key jsonb, p_values jsonb, p_client_id uuid) TO authenticated;

--
-- Name: FUNCTION run_sql_editor_query(query text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.run_sql_editor_query(query text) TO authenticated;

--
-- Name: TABLE data_studio_mutation_log; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.data_studio_mutation_log TO authenticated;

--
-- Name: TABLE data_studio_table_config; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.data_studio_table_config TO authenticated;

--
-- PostgreSQL database dump complete
--
*/
