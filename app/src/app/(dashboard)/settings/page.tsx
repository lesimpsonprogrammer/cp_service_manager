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
import { JarenSkillsForm, JarenSkillsReadOnly } from "@/components/settings/JarenSkillsForm";
import { JarenBackgroundControls } from "@/components/jaren/JarenBackgroundControls";
import { orgRoleLabel } from "@/lib/org/roleLabels";
import { ESSENTIAL_SKILL_LABELS, ENHANCED_SKILL_LABELS, type EssentialSkill, type EnhancedSkill } from "@/lib/jaren/agent";

const ADMIN_ROLES = new Set(["owner", "admin"]);

const ESSENTIAL_OPTIONS = (Object.entries(ESSENTIAL_SKILL_LABELS) as [EssentialSkill, string][]).map(
  ([value, label]) => ({ value, label })
);
const ENHANCED_OPTIONS = (Object.entries(ENHANCED_SKILL_LABELS) as [EnhancedSkill, string][]).map(
  ([value, label]) => ({ value, label })
);
const DEFAULT_ESSENTIAL = ESSENTIAL_OPTIONS.map((o) => o.value);
const DEFAULT_ENHANCED = ENHANCED_OPTIONS.map((o) => o.value);

export default async function SettingsPage() {
  const org = await getCurrentOrg();
  const supabase = await createClient();
  const isAdmin = !!org && ADMIN_ROLES.has(org.role);

  const { data: members } = await supabase
    .from("org_members")
    .select("user_id, role, created_at")
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

  const { data: docCategories } = await supabase
    .from("doc_categories")
    .select("id, name")
    .eq("org_id", org?.orgId ?? "")
    .order("name", { ascending: true });

  const { data: jarenSettings } = org
    ? await supabase
        .from("jaren_agent_settings")
        .select("essential_skills, enhanced_skills")
        .eq("org_id", org.orgId)
        .maybeSingle()
    : { data: null };

  const activeEssential = jarenSettings?.essential_skills ?? DEFAULT_ESSENTIAL;
  const activeEnhanced = jarenSettings?.enhanced_skills ?? DEFAULT_ENHANCED;

  const sections = [
    { id: "people", label: "People" },
    ...(isAdmin ? [{ id: "access", label: "Access Permissions" }] : []),
    { id: "appearance", label: "App Appearance" },
    { id: "docs", label: "Doc" },
    { id: "jaren", label: "Jaren Agentic Settings" },
  ];

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title="Settings" description="Workspace details and membership." />

      <nav className="flex flex-wrap gap-x-4 gap-y-1 border-b border-border pb-3 text-sm">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="text-muted hover:text-foreground">
            {s.label}
          </a>
        ))}
      </nav>

      <Card id="people" className="scroll-mt-4">
        <CardHeader>
          <CardTitle>People</CardTitle>
          <CardDescription>Workspace details and who's in this workspace.</CardDescription>
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
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {(members ?? []).map((m) => (
              <li key={m.user_id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="font-mono text-xs text-muted">{m.user_id}</span>
                <Badge tone="neutral" className="capitalize">
                  {orgRoleLabel(m.role)}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {isAdmin && (
        <div id="access" className="scroll-mt-4 space-y-4">
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
        </div>
      )}

      <Card id="appearance" className="scroll-mt-4">
        <CardHeader>
          <CardTitle>App Appearance</CardTitle>
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

      <Card id="docs" className="scroll-mt-4">
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

      <Card id="jaren" className="scroll-mt-4">
        <CardHeader>
          <CardTitle>Jaren Agentic Settings</CardTitle>
          <CardDescription>
            Which duties Jaren CP leads with. His identity and security rules stay fixed — only the duty tags
            here change what he's told to prioritize.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          {isAdmin ? (
            <JarenSkillsForm
              essentialOptions={ESSENTIAL_OPTIONS}
              enhancedOptions={ENHANCED_OPTIONS}
              activeEssential={activeEssential}
              activeEnhanced={activeEnhanced}
            />
          ) : (
            <JarenSkillsReadOnly
              essentialOptions={ESSENTIAL_OPTIONS}
              enhancedOptions={ENHANCED_OPTIONS}
              activeEssential={activeEssential}
              activeEnhanced={activeEnhanced}
            />
          )}

          <div className="border-t border-border pt-4">
            <JarenBackgroundControls />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
