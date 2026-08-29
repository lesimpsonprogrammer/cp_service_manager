import { createClient } from "@/lib/supabase/server";
import { getCurrentClientPortalUser } from "@/lib/portal/getCurrentClientPortalUser";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProjectKanbanBoard } from "@/components/portal/ProjectKanbanBoard";

export default async function ClientDashboardPage() {
  const clientUser = await getCurrentClientPortalUser();
  if (!clientUser) return null;

  const supabase = await createClient();
  const [{ data: projects }, { data: client }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, project_code, status, updated_at")
      .eq("client_id", clientUser.clientId)
      .order("updated_at", { ascending: false }),
    supabase.from("clients").select("project_manager_id").eq("id", clientUser.clientId).maybeSingle(),
  ]);

  const { data: projectManager } = client?.project_manager_id
    ? await supabase.from("profiles").select("full_name").eq("id", client.project_manager_id).maybeSingle()
    : { data: null };

  return (
    <div>
      <PageHeader
        title={`Hi, welcome to ${clientUser.clientName}'s portal`}
        description={
          projectManager?.full_name
            ? `Your Project Manager is ${projectManager.full_name}. Track project work from intake through final approval — this board updates in real time.`
            : "Track project work from intake through final approval — this board updates in real time."
        }
      />
      <ProjectKanbanBoard clientId={clientUser.clientId} initialProjects={projects ?? []} />
    </div>
  );
}
