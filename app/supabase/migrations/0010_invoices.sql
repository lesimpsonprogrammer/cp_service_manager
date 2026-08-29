-- Invoicing: itemized bills issued to a client, optionally generated from a
-- timecard's billable hours, tracked through draft -> sent -> paid (or void).

create type invoice_status as enum (
  'draft',
  'sent',
  'paid',
  'overdue',
  'void'
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  contract_id uuid references client_contracts (id) on delete set null,
  timecard_id uuid references timecards (id) on delete set null,

  invoice_number text not null,
  status invoice_status not null default 'draft',

  issue_date date not null default current_date,
  due_date date,

  subtotal numeric(12, 2) not null default 0,
  tax_rate numeric(5, 2) not null default 0,
  tax_amount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,

  notes text,

  billing_contact_name text,
  billing_contact_email text,

  sent_at timestamptz,
  paid_at timestamptz,

  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index invoices_org_id_invoice_number_idx on invoices (org_id, invoice_number);
create index invoices_client_id_idx on invoices (client_id, created_at desc);
create index invoices_contract_id_idx on invoices (contract_id);
create index invoices_timecard_id_idx on invoices (timecard_id);

alter table invoices enable row level security;

create policy "org members can manage invoices"
  on invoices for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create table invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  org_id uuid not null references organizations (id) on delete cascade,
  description text not null,
  quantity numeric(10, 2) not null default 1,
  unit_price numeric(12, 2) not null default 0,
  amount numeric(12, 2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index invoice_line_items_invoice_id_idx on invoice_line_items (invoice_id, sort_order);

alter table invoice_line_items enable row level security;

create policy "org members can manage invoice line items"
  on invoice_line_items for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));
