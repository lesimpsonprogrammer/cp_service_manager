import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { SqlEditorWorkspace } from "@/components/sql-editor/SqlEditorWorkspace";
import { getRecentQueryLog, getScopableClients } from "./actions";

const ADMIN_ROLES = new Set(["owner", "admin"]);

export default async function SqlEditorPage() {
  const org = await getCurrentOrg();
  if (!org || !ADMIN_ROLES.has(org.role)) {
    redirect("/dashboard");
  }

  const [recentQueries, clients] = await Promise.all([getRecentQueryLog(), getScopableClients()]);
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";

  return (
    <div className="max-w-5xl">
      <SqlEditorWorkspace
        orgName={org.orgName}
        environment={environment}
        lockOrgScope={org.sqlEditorLockOrgScope}
        clients={clients}
        recentQueries={recentQueries}
      />
    </div>
  );
}
