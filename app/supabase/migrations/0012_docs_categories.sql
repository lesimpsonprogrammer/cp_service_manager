-- Groups docs into categories (GitHub-docs-style sidebar navigation).

alter table docs add column category text not null default 'General';

create index docs_org_id_category_idx on docs (org_id, category);
