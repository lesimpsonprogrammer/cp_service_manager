-- ---------------------------------------------------------------------------
-- Tax filing connector (e.g. TaxBandits) as a data source type
-- ---------------------------------------------------------------------------

alter type data_source_type add value if not exists 'tax_filing';
