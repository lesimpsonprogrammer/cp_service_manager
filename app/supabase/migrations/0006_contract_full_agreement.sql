-- Additional per-contract fields needed to fully replace an external
-- e-signature vendor for a standard multi-section service agreement.

alter table client_contracts
  add column client_address text,
  add column services_description text,
  add column hourly_rate numeric(10, 2);
