"""Writes supabase/cpsm_schema_all_in_one.sql to stdout. Run via build.sh.

Args: <migrations dir> <snapshots dir> <pg_dump schema file> <catalog.sql>
"""

import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

FIELD, RECORD = "\x1f", "\x1e"

# Summary column order for the roadmap table; anything else lands in "other".
ROADMAP_KINDS = [
    ("table", "tables"),
    ("column", "columns"),
    ("policy", "policies"),
    ("function", "functions"),
    ("index", "indexes"),
]

# Readable names for the roadmap and report. A migration missing here falls
# back to the first sentence of its header comment.
TITLES = {
    "0001_init.sql": "Core platform: orgs, members, data sources, pipelines, API keys, webhooks",
    "0002_clients.sql": "Clients",
    "0003_client_onboarding.sql": "Client onboarding + contracts",
    "0004_contract_esignature.sql": "Contract e-signature, client billing + compliance flags",
    "0005_agreement_templates.sql": "Agreement templates",
    "0006_contract_full_agreement.sql": "Full service-agreement contract fields",
    "0007_time_entries.sql": "Project time tracking",
    "0008_timecard_approvals.sql": "Timecard approvals",
    "0009_docs.sql": "Internal docs / wiki",
    "0010_invoices.sql": "Invoicing",
    "0010_tax_filing_connector.sql": "Tax filing connector (TaxBandits)",
    "0011_signup_approval.sql": "Signup approval",
    "0012_docs_categories.sql": "Doc categories (free text)",
    "0013_client_portal.sql": "Client portal",
    "0013_doc_categories.sql": "Managed doc category list",
    "0014_traceable_ids.sql": "Traceable IDs for contracts, timecards, workflows",
    "0015_password_expiry.sql": "30-day password expiry",
    "0016_project_manager.sql": "Client project manager",
    "0017_adp_paychex_connectors.sql": "ADP + Paychex connectors",
    "0018_pipeline_preview_and_rollback.sql": "Pipeline preview + rollback",
    "0019_blog_posts.sql": "Public blog",
    "0020_brief_download_leads.sql": "Executive Brief download leads",
    "0021_web_scraper_connector.sql": "Web scraper connector",
    "0022_workflow_center.sql": "Workflow Center",
    "0023_jaren_conversations.sql": "Jaren chat history",
    "0024_sql_editor.sql": "Read-only SQL editor",
    "0025_org_role_sys_admin.sql": "sys_admin role for AI agents",
    "0026_ai_agents.sql": "AI agent governance + autonomy settings",
    "0027_security_rules.sql": "Security rules + findings",
    "0028_enhancement_tasks.sql": "Enhancement task manager",
    "0029_enhancement_task_assignee_due_date.sql": "Enhancement task assignee + due date",
    "0030_client_portal_roles.sql": "Client portal roles",
    "0031_jaren_agent_settings.sql": "Jaren agent skill settings",
    "0032_data_studio_postgres_rw.sql": "Data Studio read/write",
    "0033_data_studio_private_audit.sql": "Data Studio private audit helper",
    "0034_business_agreement_client_ids.sql": "Business IDs for clients + agreements",
    "0035_jaren_power_bi_skill.sql": "Jaren Power BI skill",
}


def sql_literal(value):
    return "'" + value.replace("'", "''") + "'"


def enhancement_title(path):
    """TITLES entry, else the first sentence of the header comment."""
    if path.name in TITLES:
        return TITLES[path.name]
    lines = []
    for line in path.read_text().splitlines():
        if not line.startswith("--"):
            if lines:
                break
            continue
        text = line.lstrip("-").strip()
        if not text and line.strip("-").strip() == "" and len(line) > 3:
            continue  # a "-- -----" rule line
        if not text:
            if lines:
                break
            continue
        lines.append(text)
    title = " ".join(lines)
    title = re.split(r"(?<=[.:;])\s|\s—\s|\s\(", title)[0].rstrip(".:;")
    if len(title) > 70:
        title = title[:67].rsplit(" ", 1)[0] + "..."
    return title or path.stem


def read_snapshot(path):
    rows = set()
    for record in path.read_text().split(RECORD):
        record = record.strip("\n")
        if record:
            kind, name, detail = record.split(FIELD)
            rows.add((kind, name, detail))
    return rows


def main():
    migrations_dir, snapshots_dir, dump_path, catalog_path = map(Path, sys.argv[1:5])
    migrations = sorted(p.name for p in migrations_dir.glob("*.sql"))
    snapshots = {m: read_snapshot(snapshots_dir / m) for m in migrations}
    final = snapshots[migrations[-1]]

    # Credit each end-state object (exact detail included, so a function
    # rewritten later is credited to the rewrite) to the first migration
    # after which it exists.
    origin = {}
    for m in migrations:
        for obj in snapshots[m]:
            if obj in final and obj not in origin:
                origin[obj] = m

    by_migration = defaultdict(list)
    for obj, m in origin.items():
        by_migration[m].append(obj)

    titles = {m: enhancement_title(migrations_dir / m) for m in migrations}
    dump = clean_dump(dump_path.read_text())
    catalog = catalog_path.read_text().strip().rstrip(";")

    out = []
    w = out.append
    rule = "-- " + "=" * 74

    w(rule)
    w("-- CPSM SCHEMA - ALL IN ONE: PLANNED vs LIVE")
    w(rule)
    w(f"-- Generated from app/supabase/migrations/ ({len(migrations)} files, through")
    w(f"-- {migrations[-1]}). Do not hand-edit: after adding a migration, rerun")
    w("--   app/scripts/schema-all-in-one/build.sh")
    w("--")
    w("-- HOW TO USE")
    w("--   Paste this whole file into the Supabase SQL editor and click Run.")
    w("--   Only Part 2 executes, and it is a single read-only SELECT: it reads")
    w("--   the system catalogs and changes nothing. Parts 1 and 3 are comments.")
    w("--")
    w("--   The result has one row per finding, sorted by section:")
    w("--     1 - Enhancement summary  one row per migration:")
    w("--                                LIVE         every object it adds is in the live DB")
    w("--                                PARTIAL      some objects missing or different")
    w("--                                NOT APPLIED  none of its objects are live")
    w("--     2 - Missing from live    planned objects the live DB doesn't have")
    w("--     3 - Live but different   present, but type / default / function body /")
    w("--                              RLS differs from the repo")
    w("--     4 - Live only            in the live DB but in no migration (drift")
    w("--                              made by hand in the dashboard or SQL editor)")
    w("--")
    w("--   Column defaults are compared as Postgres prints them; if the live")
    w("--   project runs a different Postgres major version a default can show")
    w("--   in section 3 with an equivalent spelling - compare the two columns.")
    w("--   Policies are compared by name and command, not by their USING text.")
    w("")
    w(rule)
    w("-- PART 1 - ENHANCEMENT ROADMAP (planned: what each migration adds)")
    w(rule)
    header = f"-- {'migration':<46}{'tables':>7}{'cols':>6}{'policy':>7}{'fns':>5}{'index':>6}{'other':>6}"
    w(header)
    w("--   enhancement")
    w("-- " + "-" * 74)
    for m in migrations:
        counts = Counter(kind for kind, _, _ in by_migration[m])
        cells = [counts.pop(kind, 0) for kind, _ in ROADMAP_KINDS]
        other = sum(counts.values())
        w(f"-- {m:<46}" + "".join(f"{c:>{n}}" for c, n in zip(cells + [other], [7, 6, 7, 5, 6, 6])))
        w(f"--   {titles[m]}")
    totals = Counter(kind for kind, _, _ in final)
    w("-- " + "-" * 74)
    w("-- End state: " + ", ".join(f"{n} {k}" for k, n in sorted(totals.items())))
    w("")
    w(rule)
    w("-- PART 2 - PLANNED vs LIVE REPORT (this is the part that runs)")
    w(rule)
    w(build_report(migrations, titles, origin, catalog))
    w("")
    w(rule)
    w("-- PART 3 - FULL PLANNED SCHEMA (reference only, inside a comment)")
    w("-- End state after every migration, from pg_dump --schema-only. Not shown:")
    w("-- the on_auth_user_created trigger on auth.users (0001/0011), which lives")
    w("-- in Supabase's auth schema; see Part 1 and the report for it.")
    w(rule)
    w("/*")
    w(dump)
    w("*/")
    print("\n".join(out))


def build_report(migrations, titles, origin, catalog):
    planned_rows = ",\n".join(
        f"    ({sql_literal(m)}, {sql_literal(k)}, {sql_literal(n)}, {sql_literal(d)})"
        for (k, n, d), m in sorted(origin.items(), key=lambda item: (item[1], item[0]))
    )
    migration_rows = ",\n".join(
        f"    ({sql_literal(m)}, {sql_literal(titles[m])})" for m in migrations
    )
    catalog = "\n".join("    " + line if line else "" for line in catalog.splitlines())
    return f"""with migrations (migration, enhancement) as (
  values
{migration_rows}
),
planned (migration, kind, name, detail) as (
  values
{planned_rows}
),
live as (
{catalog}
),
compared as (
  select p.migration, p.kind, p.name, p.detail as planned_detail, l.detail as live_detail,
         case when l.name is null then 'missing'
              when p.detail is distinct from l.detail then 'different'
              else 'live' end as state
  from planned p
  left join live l on l.kind = p.kind and l.name = p.name
),
summary as (
  select m.migration, m.enhancement,
         count(c.name) as total,
         count(c.name) filter (where c.state = 'live') as live_count
  from migrations m
  left join compared c on c.migration = m.migration
  group by m.migration, m.enhancement
)
select section, migration, enhancement, status, kind, object, planned, live
from (
  select '1 - Enhancement summary' as section, s.migration, s.enhancement,
         case when s.total = 0 then 'NO SCHEMA OBJECTS (data-only)'
              when s.live_count = s.total then 'LIVE'
              when s.live_count = 0 then 'NOT APPLIED'
              else 'PARTIAL (' || s.live_count || ' of ' || s.total || ' live)' end as status,
         null::text as kind, null::text as object,
         s.total || ' objects' as planned, s.live_count || ' live' as live
  from summary s
  union all
  select case c.state when 'missing' then '2 - Missing from live' else '3 - Live but different' end,
         c.migration, m.enhancement, upper(c.state), c.kind, c.name,
         nullif(c.planned_detail, ''), nullif(c.live_detail, '')
  from compared c
  join migrations m on m.migration = c.migration
  where c.state <> 'live'
  union all
  select '4 - Live only', null, null, 'NOT IN ANY MIGRATION', l.kind, l.name, null, nullif(l.detail, '')
  from live l
  where l.kind not in ('function body', 'column default', 'rls')
    and not exists (select 1 from planned p where p.kind = l.kind and p.name = l.name)
) report
order by section, migration nulls last, kind, object;"""


def clean_dump(text):
    keep = []
    for line in text.splitlines():
        if line.startswith(("SET ", "SELECT pg_catalog.set_config", "\\restrict", "\\unrestrict")):
            continue
        if line.startswith("-- Dumped "):
            continue
        keep.append(line)
    dump = re.sub(r"\n{3,}", "\n\n", "\n".join(keep)).strip()
    # Part 3 sits inside /* */, so a stray comment marker would break the file.
    if "*/" in dump or "/*" in dump:
        sys.exit("schema dump contains a /* or */ marker; Part 3 cannot be wrapped")
    return dump


if __name__ == "__main__":
    main()
