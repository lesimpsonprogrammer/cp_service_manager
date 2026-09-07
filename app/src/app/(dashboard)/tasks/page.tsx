import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { getOrgMembers } from "@/lib/org/getOrgMembers";
import { PageHeader } from "@/components/ui/PageHeader";
import { TaskBoard } from "@/components/tasks/TaskBoard";

export default async function TasksPage() {
  const org = await getCurrentOrg();
  const supabase = await createClient();

  const [{ data: tasks }, members] = await Promise.all([
    org
      ? supabase
          .from("enhancement_tasks")
          .select("id, title, description, notes, status, priority, assignee_id")
          .eq("org_id", org.orgId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    org ? getOrgMembers(org.orgId) : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader
        title="Task Manager"
        description="Enhancements and changes the team is tracking outside of GitHub."
      />
      <TaskBoard tasks={tasks ?? []} members={members} />
    </div>
  );
}
