import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BrandColorPicker } from "@/components/ui/BrandColorPicker";
import { BackgroundPicker } from "@/components/ui/BackgroundPicker";
import { InvitesPanel } from "@/components/settings/InvitesPanel";
import { SignupRequestsPanel } from "@/components/settings/SignupRequestsPanel";
import { DocCategoriesPanel } from "@/components/settings/DocCategoriesPanel";

const ADMIN_ROLES = new Set(["owner", "admin"]);

export default async function SettingsPage() {
  const org = await getCurrentOrg();
  const supabase = await createClient();
  const isAdmin = !!org && ADMIN_ROLES.has(org.role);

  const { data: members } = await supabase
    .from("org_members")
    .select("user_id, role, created_at")
    .eq("org_id", org?.orgId ?? "");

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

  const { data: docCategories } = await supabase
    .from("doc_categories")
    .select("id, name")
    .eq("org_id", org?.orgId ?? "")
    .order("name", { ascending: true });

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

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground">Theme</p>
              <p className="text-xs text-muted">Switch between light and dark mode.</p>
            </div>
            <ThemeToggle />
          </div>

          <div>
            <p className="text-foreground">Accent color</p>
            <p className="mb-2 text-xs text-muted">Choose the color used for buttons, links, and highlights.</p>
            <BrandColorPicker />
          </div>

          <div>
            <p className="text-foreground">Background</p>
            <p className="mb-2 text-xs text-muted">Choose the base tone for the app background.</p>
            <BackgroundPicker />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Doc categories</CardTitle>
          <CardDescription>
            The categories available when writing a doc — shown as the groups in the Docs sidebar.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DocCategoriesPanel categories={docCategories ?? []} />
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
