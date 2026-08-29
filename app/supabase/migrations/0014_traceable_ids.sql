-- Every client-visible business process gets a short, human-readable
-- traceable ID — projects already have `project_code` and invoices already
-- have `invoice_number`; this extends the same convention to contracts,
-- timecards, and pipeline runs so a client (or staff) can reference
-- "CTR-...", "TC-...", "RUN-..." when following up on anything in the
-- client portal.

alter table client_contracts add column contract_number text;
alter table timecards add column timecard_number text;
alter table pipeline_runs add column run_number text;

update client_contracts set contract_number = 'CTR-' || upper(substr(id::text, 1, 8)) where contract_number is null;
update timecards set timecard_number = 'TC-' || upper(substr(id::text, 1, 8)) where timecard_number is null;
update pipeline_runs set run_number = 'RUN-' || upper(substr(id::text, 1, 8)) where run_number is null;

alter table client_contracts alter column contract_number set not null;
alter table timecards alter column timecard_number set not null;
alter table pipeline_runs alter column run_number set not null;

alter table client_contracts alter column contract_number set default ('CTR-' || upper(substr(gen_random_uuid()::text, 1, 8)));
alter table timecards alter column timecard_number set default ('TC-' || upper(substr(gen_random_uuid()::text, 1, 8)));
alter table pipeline_runs alter column run_number set default ('RUN-' || upper(substr(gen_random_uuid()::text, 1, 8)));

create unique index client_contracts_contract_number_idx on client_contracts (org_id, contract_number);
create unique index timecards_timecard_number_idx on timecards (org_id, timecard_number);
create unique index pipeline_runs_run_number_idx on pipeline_runs (org_id, run_number);
