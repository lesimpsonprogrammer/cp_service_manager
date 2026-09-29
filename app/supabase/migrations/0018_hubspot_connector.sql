-- ---------------------------------------------------------------------------
-- HubSpot CRM connector, following the same pattern as
-- 0017_adp_paychex_connectors.sql: a dedicated type because HubSpot needs a
-- private-app bearer token and object-type-aware (contacts/companies) batch
-- upsert/archive calls rather than the generic REST API auth modes.
-- ---------------------------------------------------------------------------

alter type data_source_type add value if not exists 'hubspot';
