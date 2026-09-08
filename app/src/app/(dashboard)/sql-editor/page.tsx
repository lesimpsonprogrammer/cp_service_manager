import { redirect } from "next/navigation";
import { getCurrentOrg, getOrgMemberships } from "@/lib/org/getCurrentOrg";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { OrgSwitcher } from "@/components/layout/OrgSwitcher";
import { SqlEditorConsole } from "@/components/sql-editor/SqlEditorConsole";
import { getRecentQueryLog } from "./actions";

const ADMIN_ROLES = new Set(["owner", "admin"]);

export default async function SqlEditorPage() {
  const org = await getCurrentOrg();
  if (!org || !ADMIN_ROLES.has(org.role)) {
    redirect("/dashboard");
  }

  const [recentQueries, memberships] = await Promise.all([getRecentQueryLog(), getOrgMemberships()]);
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="SQL Editor"
        description="Read-only. Run SELECT queries against your organization's own data — every table you can see here is the same data RLS already scopes to you."
        action={
          <div className="flex items-center gap-2">
            <Badge tone="neutral" className="whitespace-nowrap px-4 capitalize">
              env: {environment}
            </Badge>
            <OrgSwitcher currentOrgId={org.orgId} currentOrgName={org.orgName} memberships={memberships} />
          </div>
        }
      />

      <SqlEditorConsole recentQueries={recentQueries} />
    </div>
  );
}
