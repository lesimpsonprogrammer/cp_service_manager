import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentClientPortalUser } from "@/lib/portal/getCurrentClientPortalUser";
import { canAccessPortalScreen, firstAccessiblePortalPath } from "@/lib/portal/permissions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { ClientNewTicketForm } from "@/components/service-desk/ClientPortalTicketForms";

export default async function ClientNewTicketPage() {
  const clientUser = await getCurrentClientPortalUser();
  if (!clientUser) return null;
  if (!canAccessPortalScreen(clientUser.role, "support")) redirect(firstAccessiblePortalPath(clientUser.role));

  const supabase = await createClient();
  const [{ data: categories }, { data: projects }] = await Promise.all([
    supabase.from("ticket_categories").select("id, name, description").eq("org_id", clientUser.orgId).eq("is_active", true).order("name"),
    supabase
      .from("projects")
      .select("id, name, project_code")
      .eq("client_id", clientUser.clientId)
      .neq("status", "complete")
      .order("name"),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="mb-1 text-sm text-muted">
        <Link href="/client/support" className="hover:text-foreground">
          ← Support
        </Link>
      </div>
      <PageHeader title="New request" description="Tell us what you need. The more detail you share, the faster we can help." />
      <Card>
        <CardContent className="py-5">
          <ClientNewTicketForm categories={categories ?? []} projects={projects ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
