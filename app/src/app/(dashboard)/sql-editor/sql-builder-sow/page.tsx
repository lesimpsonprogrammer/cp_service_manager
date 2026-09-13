import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const ADMIN_ROLES = new Set(["owner", "admin"]);

const sections = [
  {
    title: "1. Project Purpose",
    body: [
      "Expand Cloud Performance Data Studio into a secure internal PostgreSQL SQL Builder that allows authorized users to inspect, build, execute, and govern database operations without requiring direct database credentials or advanced SQL knowledge.",
      "The SQL Builder is both a visual query-building environment and a governed database operations layer. The existing raw SQL Console remains available for SELECT/CTE validation, while writes continue through controlled Data Studio workflows.",
    ],
  },
  {
    title: "2. Core Objective",
    bullets: [
      "Support SELECT, INSERT, UPDATE, DELETE, JOIN construction, WHERE conditions, sorting, grouping, aggregation, pagination, saved queries, query preview, result preview, and CSV export.",
      "Do not expose DROP, ALTER, TRUNCATE, CREATE TABLE, CREATE SCHEMA, GRANT, REVOKE, or database role changes through the normal Data Studio interface.",
      "DDL remains migration-only and must continue through reviewed schema changes.",
    ],
  },
  {
    title: "3. Database Explorer",
    bullets: [
      "Display PostgreSQL schema, tables, columns, primary keys, foreign keys, indexes, and constraints.",
      "For each table show row count, PostgreSQL data type, nullability, default values, identity/generated status, relationships, and Data Studio permissions.",
      "Selecting a table should immediately allow an authorized user to inspect its records.",
    ],
  },
  {
    title: "4. Visual Query Builder",
    bullets: [
      "Allow users to choose a table, columns, joins, filters, grouping, sorting, aggregations, and record limits without manually writing SQL.",
      "Always show the generated PostgreSQL statement before execution.",
      "Generated SQL must retain organization/client scoping and the existing Data Studio execution limits.",
    ],
  },
  {
    title: "5. JOIN Builder",
    bullets: [
      "Use existing PostgreSQL foreign-key relationships to suggest JOINs automatically.",
      "Support INNER JOIN, LEFT JOIN, and RIGHT JOIN initially.",
      "Users should normally select related records/tables instead of manually entering relationship IDs.",
    ],
  },
  {
    title: "6. Filter Builder",
    bullets: [
      "Support equals, not equal, greater/less than, greater/less than or equal, contains, begins with, ends with, IN, NOT IN, IS NULL, IS NOT NULL, and BETWEEN.",
      "Support AND/OR condition groups.",
      "Translate visual conditions into generated SQL that is visible before execution.",
    ],
  },
  {
    title: "7. Aggregation Builder",
    bullets: [
      "Support COUNT, SUM, AVG, MIN, and MAX.",
      "Support GROUP BY and sortable aggregate results.",
      "Aggregation must work from the visual builder without requiring manual SQL.",
    ],
  },
  {
    title: "8. Data Editor",
    bullets: [
      "Browse, create, edit, delete, copy, refresh, and export authorized records.",
      "Protect system-managed fields such as id, org_id, created_by, created_at, identity fields, and other configured protected columns.",
      "Render editing controls from PostgreSQL schema metadata where possible.",
    ],
  },
  {
    title: "9. Insert / Update / Delete Controls",
    bullets: [
      "INSERT forms should map PostgreSQL types to appropriate controls such as toggles, dropdowns, date pickers, text areas, JSON editors, and relationship selectors.",
      "UPDATE operations must target an explicit primary key and show current value versus proposed value before commit.",
      "DELETE operations require explicit confirmation showing table, organization, client when applicable, primary key, and record summary.",
      "Bulk delete is out of scope for the initial release.",
    ],
  },
  {
    title: "10. Write Preview",
    bullets: [
      "Before INSERT, UPDATE, or DELETE, show operation, table, organization, client scope, record key, affected fields, current values, and proposed values.",
      "The user must explicitly choose Cancel or Commit Change.",
    ],
  },
  {
    title: "11. Organization and Client Scope",
    bullets: [
      "Every applicable operation must remain scoped by org_id and, when supported, client_id.",
      "Users must never be able to read or modify records belonging to another organization.",
      "When client scope is selected, applicable reads and writes must remain limited to that client.",
      "Retain the existing organization-wide SQL/Data Studio scope setting.",
    ],
  },
  {
    title: "12. Security",
    bullets: [
      "Initial access is restricted to Owner and Admin roles.",
      "All PostgreSQL operations must continue to respect Row Level Security.",
      "Never send service-role keys, database passwords, privileged secret keys, or PostgreSQL administrator credentials to the browser.",
      "Verify authorization server-side even when UI controls are hidden.",
      "Raw ad-hoc SQL writes remain disabled; governed writes use Data Studio mutation workflows.",
    ],
  },
  {
    title: "13. Audit Logging",
    bullets: [
      "Every successful INSERT, UPDATE, and DELETE must create an immutable audit record.",
      "Capture organization ID, client ID when applicable, user ID, table, operation, record key, previous record, resulting record, and timestamp.",
      "Audit records must not be editable through Data Studio.",
      "Privileged audit helpers remain in a non-exposed PostgreSQL schema.",
    ],
  },
  {
    title: "14. SQL Console",
    bullets: [
      "Retain SELECT and WITH/CTE support for advanced validation and investigation.",
      "Continue enforcing statement timeout, result caps, organization/client scope, and query history.",
      "JOINs, aggregations, and safe PostgreSQL functions used through SELECT remain supported.",
    ],
  },
  {
    title: "15. Saved Queries and Query History",
    bullets: [
      "Saved queries should support name, description, SQL, creator, organization, optional client scope, created/updated dates, tags, and category.",
      "Suggested categories include HR, Payroll, Finance, ETL, Validation, Compliance, Operations, and Reporting.",
      "Query history should capture user, query, tables, execution time, returned rows, success/error status, and timestamp, with the ability to reopen a prior query.",
    ],
  },
  {
    title: "16. Results Grid",
    bullets: [
      "Provide horizontal scrolling, sortable columns, pagination, copy cell, copy row, export CSV, refresh, column visibility, and record detail view.",
      "Future enhancements may include Excel export, JSON export, PDF reports, and chart creation from query results.",
    ],
  },
  {
    title: "17. Error Handling and Performance",
    bullets: [
      "Translate common PostgreSQL errors into understandable user-facing messages while preserving technical details in an expandable admin view.",
      "Never silently swallow database errors.",
      "Default result size: 100 rows. Maximum interactive SQL Console result: 500 rows.",
      "Use server-side pagination for large data sets and retain query timeout protection.",
    ],
  },
  {
    title: "18. PostgreSQL-First Architecture",
    bullets: [
      "Treat PostgreSQL as the core data platform and Supabase as the current hosting/auth/RLS/API infrastructure.",
      "Architecture: Cloud Performance → Data Studio → PostgreSQL → Supabase infrastructure.",
      "Design Data Studio so additional PostgreSQL connections can be introduced later without rebuilding the core interface.",
    ],
  },
  {
    title: "19. Future Database Connections",
    bullets: [
      "Future targets may include CPSM PostgreSQL, Client PostgreSQL, Reporting PostgreSQL, ETL Staging PostgreSQL, and a Data Warehouse.",
      "External connections should eventually be represented as configurable Data Sources rather than hardcoded connections.",
      "Do not implement external production credential management unless separately authorized.",
    ],
  },
  {
    title: "20. Initial Enabled Tables",
    bullets: [
      "clients", "projects", "data_sources", "client_contracts", "time_entries", "timecards", "invoices", "invoice_line_items", "pipelines", "pipeline_runs", "docs", "agreement_templates", "blog_posts", "enhancement_tasks",
    ],
  },
  {
    title: "21. Deliverables",
    bullets: [
      "PostgreSQL Data Studio configuration and controlled mutation architecture.",
      "Schema metadata service, Data Explorer, Data Editor, and Visual SQL Builder.",
      "Existing SQL Console integration, organization/client scope controls, write preview, audit logging, query history, CSV export, and saved-query foundation.",
      "Navigation, PostgreSQL migrations, TypeScript database definitions, security verification, functional testing, and documentation.",
    ],
  },
  {
    title: "22. Testing Requirements",
    bullets: [
      "Read testing: schema browse, table browse, filters, SELECT, JOIN, and export.",
      "Write testing: INSERT, UPDATE, and DELETE using test records or rollback transactions only.",
      "Scope testing: Organization A cannot access Organization B; client scope cannot return another client's records.",
      "Permission testing: Owner/Admin allowed; Member/Viewer/Client Portal User denied.",
      "Audit testing: verify user, organization, operation, before data, after data, and timestamp for successful writes.",
    ],
  },
  {
    title: "23. Change Control",
    bullets: [
      "Do not make unrelated changes or remove existing pages/functionality without authorization.",
      "Do not weaken RLS, expose privileged credentials, bypass authorization client-side, or add unrestricted production SQL execution.",
      "Schema changes must continue through migrations. UI changes should remain scoped to Data Studio unless separately approved.",
    ],
  },
  {
    title: "24. Acceptance Criteria",
    bullets: [
      "An authorized admin can open Data Studio, select a table, inspect schema, browse/filter/sort records, visually build a SELECT query, view generated SQL, execute it, create/update/delete a record, preview writes, scope activity to an organization/client, export results, and review a permanent audit trail.",
      "At no point should the user need direct PostgreSQL credentials for normal Data Studio operations.",
    ],
  },
  {
    title: "25. Product Definition",
    body: [
      "Data Studio is Cloud Performance's governed internal data operations layer—not simply an SQL textbox.",
      "Long-term operating model: Connect → Inspect → Query → Transform → Validate → Write → Audit.",
    ],
  },
];

export default async function SqlBuilderSowPage() {
  const org = await getCurrentOrg();
  if (!org || !ADMIN_ROLES.has(org.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="SQL Builder — Instructions & SOW"
        description="Development requirements and acceptance criteria for the Cloud Performance visual PostgreSQL SQL Builder."
        action={
          <Link
            href="/sql-editor"
            className="rounded-md border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-border-strong hover:text-foreground"
          >
            ← Back to Data Studio
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Project Direction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted">
          <p>
            Build the SQL Builder inside the existing CP Service Manager Data Studio. Do not create a separate application.
          </p>
          <p>
            The SQL Builder visually constructs PostgreSQL queries; governed writes continue through the Data Editor and controlled mutation workflow.
          </p>
        </CardContent>
      </Card>

      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted">
            {section.body?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets && (
              <ul className="list-disc space-y-2 pl-5">
                {section.bullets.map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
