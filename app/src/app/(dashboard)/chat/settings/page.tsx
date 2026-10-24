import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { getOrgMembers } from "@/lib/org/getOrgMembers";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ChatWidgetSettingsForm } from "@/components/chat/ChatWidgetSettingsForm";

const DEFAULTS = {
  is_enabled: false,
  title: "Chat with us",
  greeting: "Hi! Ask us anything. We'll reply right here, and by email if you've stepped away.",
  accent_color: "#1f6feb",
  default_assignee_id: null,
  allowed_origins: [] as string[],
  site_url: null,
};

export default async function ChatSettingsPage() {
  const org = await getCurrentOrg();
  if (!org) redirect("/login");
  const isAdmin = org.role === "owner" || org.role === "admin";

  const supabase = await createClient();
  const [members, { data: settings }] = await Promise.all([
    getOrgMembers(org.orgId),
    supabase
      .from("chat_widget_settings")
      .select("widget_key, is_enabled, title, greeting, accent_color, default_assignee_id, allowed_origins, site_url")
      .eq("org_id", org.orgId)
      .maybeSingle(),
  ]);

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");
  const snippet = settings
    ? `<script src="${appUrl}/chat-widget.js" data-key="${settings.widget_key}" defer></script>`
    : null;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="text-sm text-muted">
        <Link href="/chat" className="hover:text-foreground">
          ← Live Chat
        </Link>
      </div>
      <PageHeader title="Chat widget settings" description="The chat bubble visitors use to reach you from your website." />

      <Card>
        <CardHeader>
          <CardTitle>Widget</CardTitle>
          <CardDescription>{isAdmin ? "How the bubble looks and who answers it." : "Only workspace admins can change these."}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChatWidgetSettingsForm value={settings ?? DEFAULTS} members={members} editable={isAdmin} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add it to your website</CardTitle>
          <CardDescription>
            Paste this just before <code>&lt;/body&gt;</code> on every page. Any link or button with{" "}
            <code>data-open-chat</code> opens the chat, and so does adding <code>?chat=open</code> to a page URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {snippet ? (
            <pre className="overflow-x-auto rounded-md border border-border bg-surface-2 p-3 text-xs text-foreground">
              <code>{snippet}</code>
            </pre>
          ) : (
            <p className="text-sm text-muted">Save the settings once to get your snippet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
