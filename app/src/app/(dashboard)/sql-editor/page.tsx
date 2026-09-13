import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { DataStudioConsole } from "@/components/sql-editor/DataStudioConsole";
import {
  getDataStudioClients,
  getDataStudioSchema,
  getRecentMutationLog,
  getRecentQueryLog,
} from "./actions";

const ADMIN_ROLES = new Set(["owner", "admin"]);

export default async function SqlEditorPage() {
  const org = await getCurrentOrg();
  if (!org || !ADMIN_ROLES.has(org.role)) {
    redirect("/dashboard");
  }

  const [recentQueries, tables, clients, mutationLog] = await Promise.all([
    getRecentQueryLog(),
    getDataStudioSchema(),
    getDataStudioClients(),
    getRecentMutationLog(),
  ]);

  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";

  return (
    <div className="max-w-[1600px]">
      <PageHeader
        title="Data Studio"
        description="Internal PostgreSQL workspace for scoped data inspection, row-level writes, SQL validation, and immutable mutation auditing."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/sql-editor/sql-builder-sow"
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-border-strong hover:text-foreground"
            >
              SQL Builder — Instructions & SOW ↗
            </Link>
            <Badge tone="neutral" className="capitalize">
              env: {environment}
            </Badge>
            <Badge tone="neutral">PostgreSQL</Badge>
            <Badge tone="success">read + write</Badge>
            <Badge tone="brand">{org.orgName}</Badge>
          </div>
        }
      />

      <DataStudioConsole
        tables={tables}
        clients={clients}
        recentQueries={recentQueries}
        initialMutationLog={mutationLog}
      />
    </div>
  );
}
