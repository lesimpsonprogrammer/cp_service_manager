import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function SettingsPage() {
  const org = await getCurrentOrg();
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("org_members")
    .select("user_id, role, created_at")
    .eq("org_id", org?.orgId ?? "");

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title="Settings" description="Workspace details and membership." />

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Name</span>
            <span className="text-foreground">{org?.orgName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Your role</span>
            <Badge tone="brand" className="capitalize">
              {org?.role}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Signed in as</span>
            <span className="text-foreground">{org?.userEmail}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {(members ?? []).map((m) => (
              <li key={m.user_id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="font-mono text-xs text-muted">{m.user_id}</span>
                <Badge tone="neutral" className="capitalize">
                  {m.role}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
