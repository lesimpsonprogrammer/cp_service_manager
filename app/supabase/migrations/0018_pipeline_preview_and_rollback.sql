-- ---------------------------------------------------------------------------
-- Pipeline run data visibility + rollback.
--
-- Two gaps in the ETL flow this closes:
--   1. A run's transformed output was never persisted anywhere, so a
--      "preview only" (no destination) run had nothing to actually review —
--      only row counts. `sample_records` stores a capped sample of the
--      transformed output for every run, preview or live.
--   2. There was no way to undo a live load. `loaded_records` snapshots what
--      was actually sent to the destination (capped) so a destination
--      adapter that supports `unload` can delete it back out again.
-- ---------------------------------------------------------------------------

alter table pipeline_runs
  add column sample_records jsonb not null default '[]'::jsonb,
  add column loaded_records jsonb not null default '[]'::jsonb,
  add column rolled_back_at timestamptz,
  add column rolled_back_by uuid references auth.users (id) on delete set null;

-- `finish()` in the ETL engine has always updated status/counts/error on the
-- run row it just inserted, but no update policy ever existed for
-- pipeline_runs — only select/insert. Rollback needs to update the same row
-- (rolled_back_at/rolled_back_by), so this was due regardless.
create policy "org members can update pipeline runs"
  on pipeline_runs for update
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));
