-- Test 2: business-facing system IDs for clients and agreements.
-- UUID primary keys remain unchanged and continue to drive relationships.

create sequence if not exists public.client_business_id_seq start with 1 increment by 1;
create sequence if not exists public.agreement_business_id_seq start with 1 increment by 1;

alter table public.clients
  add column if not exists client_number text;

alter table public.client_contracts
  add column if not exists agreement_number text;

update public.clients
set client_number = 'CLI-' || lpad(nextval('public.client_business_id_seq')::text, 6, '0')
where client_number is null;

update public.client_contracts
set agreement_number = 'AGR-' || lpad(nextval('public.agreement_business_id_seq')::text, 6, '0')
where agreement_number is null;

alter table public.clients
  alter column client_number set default ('CLI-' || lpad(nextval('public.client_business_id_seq')::text, 6, '0')),
  alter column client_number set not null;

alter table public.client_contracts
  alter column agreement_number set default ('AGR-' || lpad(nextval('public.agreement_business_id_seq')::text, 6, '0')),
  alter column agreement_number set not null;

alter sequence public.client_business_id_seq owned by public.clients.client_number;
alter sequence public.agreement_business_id_seq owned by public.client_contracts.agreement_number;

create unique index if not exists clients_client_number_key
  on public.clients (client_number);

create unique index if not exists client_contracts_agreement_number_key
  on public.client_contracts (agreement_number);

alter table public.clients
  drop constraint if exists clients_client_number_format;
alter table public.clients
  add constraint clients_client_number_format
  check (client_number ~ '^CLI-[0-9]{6,}$');

alter table public.client_contracts
  drop constraint if exists client_contracts_agreement_number_format;
alter table public.client_contracts
  add constraint client_contracts_agreement_number_format
  check (agreement_number ~ '^AGR-[0-9]{6,}$');

comment on column public.clients.client_number is
  'System-generated business-facing Client ID. UUID primary key remains the internal relational identifier.';
comment on column public.client_contracts.agreement_number is
  'System-generated business-facing Agreement ID. UUID primary key and legacy contract_number remain unchanged.';

-- Keep system-generated identifiers read-only in the generic Data Studio editor.
update public.data_studio_table_config
set protected_columns = array_append(protected_columns, 'client_number')
where table_name = 'clients'
  and not ('client_number' = any(protected_columns));

update public.data_studio_table_config
set protected_columns = array_append(protected_columns, 'agreement_number')
where table_name = 'client_contracts'
  and not ('agreement_number' = any(protected_columns));

update public.data_studio_table_config
set protected_columns = array_append(protected_columns, 'contract_number')
where table_name = 'client_contracts'
  and not ('contract_number' = any(protected_columns));
