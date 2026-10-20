import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { getOrgMembers } from "@/lib/org/getOrgMembers";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { CategoriesPanel, MacrosPanel, SlaPoliciesForm } from "@/components/service-desk/ServiceDeskSettingsPanels";
import { AUTO_CLOSE_AFTER_DAYS, DEFAULT_SLA_MINUTES, TICKET_PRIORITIES } from "@/lib/service-desk/constants";
import type { TicketPriority } from "@/types/database";

export default async function ServiceDeskSettingsPage() {
  const org = await getCurrentOrg();
  if (!org) redirect("/login");
  const isAdmin = org.role === "owner" || org.role === "admin";
  const canEdit = org.role !== "viewer";

  const supabase = await createClient();
  const [members, { data: policies }, { data: categories }, { data: macros }] = await Promise.all([
    getOrgMembers(org.orgId),
    supabase.from("ticket_sla_policies").select("priority, first_response_minutes, resolution_minutes").eq("org_id", org.orgId),
    supabase
      .from("ticket_categories")
      .select("id, name, description, default_assignee_id, is_active")
      .eq("org_id", org.orgId)
      .order("name"),
    supabase.from("ticket_macros").select("id, name, body").eq("org_id", org.orgId).order("name"),
  ]);

  const effective = Object.fromEntries(
    TICKET_PRIORITIES.map((p) => {
      const saved = (policies ?? []).find((row) => row.priority === p);
      return [
        p,
        saved
          ? { firstResponse: saved.first_response_minutes, resolution: saved.resolution_minutes, custom: true }
          : { ...DEFAULT_SLA_MINUTES[p], custom: false },
      ];
    })
  ) as Record<TicketPriority, { firstResponse: number; resolution: number; custom: boolean }>;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="text-sm text-muted">
        <Link href="/tickets" className="hover:text-foreground">
          ← Service Desk
        </Link>
      </div>
      <PageHeader
        title="Service Desk settings"
        description={`SLA targets, routing, and canned replies. Resolved tickets auto-close after ${AUTO_CLOSE_AFTER_DAYS} days without activity.`}
      />

      <Card>
        <CardHeader>
          <CardTitle>SLA targets</CardTitle>
          <CardDescription>{isAdmin ? "How fast the team commits to respond and resolve, per priority." : "Only workspace admins can change these."}</CardDescription>
        </CardHeader>
        <CardContent>
          <SlaPoliciesForm policies={effective} editable={isAdmin} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories & routing</CardTitle>
          <CardDescription>
            New tickets go to the category&apos;s default owner, then to the client&apos;s Project Manager, otherwise they wait in Unassigned.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoriesPanel categories={categories ?? []} members={members} editable={isAdmin} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Macros</CardTitle>
          <CardDescription>Canned replies anyone on the team can insert from a ticket.</CardDescription>
        </CardHeader>
        <CardContent>
          <MacrosPanel macros={macros ?? []} editable={canEdit} />
        </CardContent>
      </Card>
    </div>
  );
}
