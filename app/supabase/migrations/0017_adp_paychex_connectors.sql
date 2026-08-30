-- ---------------------------------------------------------------------------
-- Dedicated ADP Workforce Now and Paychex Flex connectors, split out of the
-- generic 'hcm' type (same pattern as 0010_tax_filing_connector.sql) since
-- both vendors need an OAuth2 client-credentials adapter rather than the
-- generic REST API auth modes.
-- ---------------------------------------------------------------------------

alter type data_source_type add value if not exists 'adp_workforce_now';
alter type data_source_type add value if not exists 'paychex_flex';
