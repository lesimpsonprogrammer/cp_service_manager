import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { InvitesPanel } from "@/components/settings/InvitesPanel";
import { SignupRequestsPanel } from "@/components/settings/SignupRequestsPanel";
import { MembersPanel } from "@/components/settings/MembersPanel";
import { orgRoleLabel } from "@/lib/org/roleLabels";

const ADMIN_ROLES = new Set(["owner", "admin"]);

export default async function TeamSettingsPage() {
  const org = await getCurrentOrg();
  const supabase = await createClient();
  const isAdmin = !!org && ADMIN_ROLES.has(org.role);

  const { data: members } = await supabase
    .from("org_members")
    .select("user_id, role, status, created_at")
    .eq("org_id", org?.orgId ?? "");

  const { data: profile } = org
    ? await supabase.from("profiles").select("full_name").eq("id", org.userId).maybeSingle()
    : { data: null };

  const { data: invites } = isAdmin
    ? await supabase
        .from("org_invites")
        .select("id, email, role, token, expires_at")
        .eq("org_id", org!.orgId)
        .is("accepted_at", null)
        .order("created_at", { ascending: false })
    : { data: [] };

  const { data: signupRequests } = isAdmin
    ? await supabase
        .from("signup_requests")
        .select("id, email, full_name, company_name, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title="Access Permissions" description="Workspace details, membership, and access requests." />

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
            <span className="text-muted">Your name</span>
            <span className="text-foreground">{profile?.full_name ?? org?.userEmail?.split("@")[0]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Your role</span>
            <Badge tone="brand" className="capitalize">
              {org?.role ? orgRoleLabel(org.role) : null}
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
          <CardDescription>Suspend or remove access; removed and suspended people land in the recycle bin below, restorable anytime.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <MembersPanel members={members ?? []} currentUserId={org?.userId ?? ""} isAdmin={isAdmin} />
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Invite people</CardTitle>
              <CardDescription>
                Send someone a direct invite link — they join this workspace immediately, no approval needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <InvitesPanel invites={invites ?? []} appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ""} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending signup requests</CardTitle>
              <CardDescription>
                Anyone who signs up without an invite link lands here — approve them into this workspace, or
                reject the request.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <SignupRequestsPanel requests={signupRequests ?? []} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
