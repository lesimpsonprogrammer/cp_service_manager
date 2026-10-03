-- One row per CPSM-owned database object: (kind, name, detail).
-- Used twice: by build.sh to snapshot the planned schema after each
-- migration, and inlined into the generated report to read the live one.
with ext as (select objid, classid from pg_depend where deptype = 'e'),
ns as (select oid, nspname from pg_namespace where nspname in ('public', 'private'))
select 'schema'::text as kind, nspname::text as name, ''::text as detail from ns where nspname <> 'public'
union all
select case c.relkind when 'v' then 'view' when 'm' then 'view' when 'S' then 'sequence' else 'table' end,
       n.nspname::text || '.' || c.relname, ''
from pg_class c join ns n on n.oid = c.relnamespace
where c.relkind in ('r', 'p', 'v', 'm', 'S')
  and c.oid not in (select objid from ext where classid = 'pg_class'::regclass)
union all
select 'rls', n.nspname::text || '.' || c.relname, case when c.relrowsecurity then 'enabled' else 'disabled' end
from pg_class c join ns n on n.oid = c.relnamespace
where c.relkind in ('r', 'p')
  and c.oid not in (select objid from ext where classid = 'pg_class'::regclass)
union all
select 'column', n.nspname::text || '.' || c.relname || '.' || a.attname, format_type(a.atttypid, a.atttypmod)
from pg_attribute a join pg_class c on c.oid = a.attrelid join ns n on n.oid = c.relnamespace
where c.relkind in ('r', 'p', 'v', 'm') and a.attnum > 0 and not a.attisdropped
  and c.oid not in (select objid from ext where classid = 'pg_class'::regclass)
union all
select 'column default', n.nspname::text || '.' || c.relname || '.' || a.attname, pg_get_expr(d.adbin, d.adrelid)
from pg_attrdef d join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
join pg_class c on c.oid = d.adrelid join ns n on n.oid = c.relnamespace
where not a.attisdropped
  and c.oid not in (select objid from ext where classid = 'pg_class'::regclass)
union all
select 'enum value', n.nspname::text || '.' || t.typname || '.' || e.enumlabel, ''
from pg_type t join ns n on n.oid = t.typnamespace join pg_enum e on e.enumtypid = t.oid
union all
select 'enum', n.nspname::text || '.' || t.typname, ''
from pg_type t join ns n on n.oid = t.typnamespace
where t.typtype = 'e'
union all
select 'function', n.nspname::text || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', ''
from pg_proc p join ns n on n.oid = p.pronamespace
where p.oid not in (select objid from ext where classid = 'pg_proc'::regclass)
union all
-- prosrc is the body exactly as written, so this flags a live function
-- still running an older version from an earlier migration.
select 'function body', n.nspname::text || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', md5(p.prosrc)
from pg_proc p join ns n on n.oid = p.pronamespace
where p.oid not in (select objid from ext where classid = 'pg_proc'::regclass)
union all
select 'policy', pol.schemaname::text || '.' || pol.tablename || ' : ' || pol.policyname, pol.cmd
from pg_policies pol where pol.schemaname in ('public', 'private')
union all
select 'index', n.nspname::text || '.' || c.relname, ''
from pg_class c join ns n on n.oid = c.relnamespace
where c.relkind in ('i', 'I')
  and c.oid not in (select objid from ext where classid = 'pg_class'::regclass)
union all
select 'constraint', n.nspname::text || '.' || c.relname || ' : ' || con.conname,
       case con.contype when 'p' then 'primary key' when 'f' then 'foreign key' when 'u' then 'unique'
                        when 'c' then 'check' else 'exclusion' end
from pg_constraint con join pg_class c on c.oid = con.conrelid join ns n on n.oid = c.relnamespace
where con.contype in ('p', 'f', 'u', 'c', 'x')
  and c.oid not in (select objid from ext where classid = 'pg_class'::regclass)
union all
-- Triggers count when their function is ours, even on auth.users.
select 'trigger', tn.nspname::text || '.' || tc.relname || ' : ' || tg.tgname, ''
from pg_trigger tg join pg_class tc on tc.oid = tg.tgrelid join pg_namespace tn on tn.oid = tc.relnamespace
join pg_proc p on p.oid = tg.tgfoid join ns pn on pn.oid = p.pronamespace
where not tg.tgisinternal
union all
select 'realtime', pt.schemaname::text || '.' || pt.tablename, ''
from pg_publication_tables pt where pt.pubname = 'supabase_realtime'
