-- Extraction + transformation-only pipelines (no destination configured)
-- used to compute cleaned records and then discard them — only the counts
-- survived on the run. Persist a capped sample of the transformed output so
-- it can be shown/downloaded from the client portal.

alter table pipeline_runs
  add column output_sample jsonb,
  add column output_truncated boolean not null default false;

comment on column pipeline_runs.output_sample is
  'Transformed records for destination-less (preview/export) pipeline runs, capped at OUTPUT_SAMPLE_LIMIT rows in application code. Null for runs that loaded into a real destination.';
