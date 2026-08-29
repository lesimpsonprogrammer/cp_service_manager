-- Contract e-signature workflow, client billing/accounting fields, and
-- client compliance flags (HIPAA, state privacy laws).

alter table client_contracts
  add column signing_token uuid not null default gen_random_uuid(),
  add column approved_at timestamptz,
  add column approved_by uuid references auth.users (id) on delete set null,
  add column sent_at timestamptz,
  add column signed_at timestamptz,
  add column signer_name text,
  add column signer_email text,
  add column signed_by_name text,
  add column signer_ip text,
  add column reminder_count integer not null default 0,
  add column last_reminder_at timestamptz;

create unique index client_contracts_signing_token_idx on client_contracts (signing_token);

alter table clients
  add column billing_contact_name text,
  add column billing_contact_email text,
  add column billing_contact_phone text,
  add column momentum_billing_contact_name text,
  add column momentum_billing_contact_email text,
  add column payment_terms text,
  add column payment_method text,
  add column compliance_frameworks text[] not null default '{}',
  add column hipaa_covered_entity boolean not null default false,
  add column compliance_notes text;
