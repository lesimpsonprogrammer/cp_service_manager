-- ---------------------------------------------------------------------------
-- New "web_scraper" data source type: pulls records from a public URL,
-- auto-detecting HTML (table scrape), PDF (text extraction), or Excel
-- (.xlsx) content.
-- ---------------------------------------------------------------------------

alter type data_source_type add value if not exists 'web_scraper';
