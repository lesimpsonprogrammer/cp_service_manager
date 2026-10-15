import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { getOrgMembers } from "@/lib/org/getOrgMembers";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { NewTicketForm } from "@/components/glass/NewTicketForm";

export default async function NewTicketPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const org = await getCurrentOrg();
  if (!org) redirect("/login");
  if (org.role === "viewer") redirect("/tickets");

  const { client } = await searchParams;
  const supabase = await createClient();
  const [members, { data: clients }, { data: projects }, { data: categories }] = await Promise.all([
    getOrgMembers(org.orgId),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("projects").select("id, name, project_code, client_id").neq("status", "complete").order("name"),
    supabase.from("ticket_categories").select("id, name").eq("org_id", org.orgId).eq("is_active", true).order("name"),
  ]);

  const defaultClientId = client && (clients ?? []).some((c) => c.id === client) ? client : null;

  return (
    <div className="max-w-3xl">
      <PageHeader title="New ticket" description="Log a request on a client's behalf or track an internal issue. Number, SLA targets, and routing are applied automatically." />
      <Card>
        <CardContent className="py-5">
          <NewTicketForm
            clients={clients ?? []}
            projects={projects ?? []}
            categories={categories ?? []}
            members={members}
            defaultClientId={defaultClientId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
