import { createClient } from "@/lib/supabase/server";
import { getCurrentClientPortalUser } from "@/lib/portal/getCurrentClientPortalUser";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProjectKanbanBoard } from "@/components/portal/ProjectKanbanBoard";

export default async function ClientDashboardPage() {
  const clientUser = await getCurrentClientPortalUser();
  if (!clientUser) return null;

  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, project_code, status, updated_at")
    .eq("client_id", clientUser.clientId)
    .order("updated_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title={`Hi, welcome to ${clientUser.clientName}'s portal`}
        description="Track project work from intake through final approval — this board updates in real time."
      />
      <ProjectKanbanBoard clientId={clientUser.clientId} initialProjects={projects ?? []} />
    </div>
  );
}
