import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { RetentionPolicyForm } from "@/components/settings/RetentionPolicyForm";
import { ArchivePanel } from "@/components/settings/ArchivePanel";
import { getRetentionYears } from "./actions";

const ADMIN_ROLES = new Set(["owner", "admin"]);

export default async function ArchiveSettingsPage() {
  const org = await getCurrentOrg();
  if (!org || !ADMIN_ROLES.has(org.role)) {
    redirect("/settings");
  }

  const supabase = await createClient();
  const [retentionYears, { data: archivedRecords }] = await Promise.all([
    getRetentionYears("org_members"),
    supabase
      .from("archived_records")
      .select("id, category, source_id, removed_at, archived_at, batch_label")
      .eq("org_id", org.orgId)
      .order("archived_at", { ascending: false }),
  ]);

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader
        title="Data retention & archive"
        description="Removed data is archived, not deleted -- still stored, still retrievable, organized by category and batch."
      />

      <Card>
        <CardHeader>
          <CardTitle>Retention window — Team members</CardTitle>
          <CardDescription>
            Recycle-bin members older than this move into archive storage. 7 years is the pre-filled safe
            default (covers FLSA/IRS federal minimums and stricter state payroll rules) — adjust to match your
            own state&rsquo;s requirements or counsel&rsquo;s guidance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RetentionPolicyForm category="org_members" currentYears={retentionYears} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Archived records</CardTitle>
          <CardDescription>Team member removals only, for now — more categories coming later.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ArchivePanel records={archivedRecords ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
