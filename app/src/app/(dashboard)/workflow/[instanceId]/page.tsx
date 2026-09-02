import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { getOrgMembers } from "@/lib/org/getOrgMembers";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { StageTimeline } from "@/components/workflow/StageTimeline";
import { InstanceActions } from "@/components/workflow/InstanceActions";
import { TasksPanel } from "@/components/workflow/TasksPanel";

export default async function WorkflowInstancePage({
  params,
}: {
  params: Promise<{ instanceId: string }>;
}) {
  const { instanceId } = await params;
  const org = await getCurrentOrg();
  if (!org) notFound();

  const supabase = await createClient();

  const { data: instance } = await supabase
    .from("workflow_instances")
    .select("id, title, status, current_stage_id, workflow_definition_id, created_at")
    .eq("id", instanceId)
    .eq("org_id", org.orgId)
    .maybeSingle();

  if (!instance) notFound();

  const { data: definition } = await supabase
    .from("workflow_definitions")
    .select("id, name, description")
    .eq("id", instance.workflow_definition_id)
    .single();

  const { data: stages } = await supabase
    .from("workflow_stages")
    .select("id, name, position")
    .eq("workflow_definition_id", instance.workflow_definition_id)
    .order("position", { ascending: true });

  const { data: tasks } = await supabase
    .from("workflow_tasks")
    .select("id, title, description, status, assignee_id, due_at")
    .eq("workflow_instance_id", instanceId)
    .order("created_at", { ascending: true });

  const members = await getOrgMembers(org.orgId);
  const memberNameById = new Map(members.map((m) => [m.userId, m.fullName]));

  const stageList = stages ?? [];
  const currentIndex = stageList.findIndex((s) => s.id === instance.current_stage_id);
  const hasNextStage = currentIndex >= 0 && currentIndex < stageList.length - 1;

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader
        title={instance.title}
        description={definition?.name ?? "Workflow run"}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={instance.status} />
            <InstanceActions instanceId={instance.id} status={instance.status} hasNextStage={hasNextStage} />
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Stages</CardTitle>
        </CardHeader>
        <CardContent>
          <StageTimeline stages={stageList} currentStageId={instance.current_stage_id} status={instance.status} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TasksPanel
            instanceId={instance.id}
            tasks={(tasks ?? []).map((t) => ({
              id: t.id,
              title: t.title,
              description: t.description,
              status: t.status,
              assigneeName: t.assignee_id ? memberNameById.get(t.assignee_id) ?? "Former teammate" : null,
              dueAt: t.due_at,
            }))}
            members={members.map((m) => ({ userId: m.userId, fullName: m.fullName }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
