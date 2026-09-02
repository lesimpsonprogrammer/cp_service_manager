"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import type { WorkflowTaskStatus } from "@/types/database";

export interface WorkflowFormState {
  error: string | null;
}

const TASK_STATUSES = new Set<WorkflowTaskStatus>(["pending", "in_progress", "done", "skipped"]);

export async function createWorkflowDefinition(
  _prev: WorkflowFormState,
  formData: FormData
): Promise<WorkflowFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const stageNames = String(formData.get("stages") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!name) return { error: "Give the workflow a name." };
  if (stageNames.length === 0) return { error: "Add at least one stage (one per line)." };

  const supabase = await createClient();

  const { data: definition, error: definitionError } = await supabase
    .from("workflow_definitions")
    .insert({
      org_id: org.orgId,
      name,
      description: description || null,
      created_by: org.userId,
    })
    .select("id")
    .single();

  if (definitionError || !definition) {
    return { error: definitionError?.message ?? "Could not create the workflow." };
  }

  const { error: stagesError } = await supabase.from("workflow_stages").insert(
    stageNames.map((stageName, index) => ({
      org_id: org.orgId,
      workflow_definition_id: definition.id,
      name: stageName,
      position: index,
    }))
  );

  if (stagesError) return { error: stagesError.message };

  revalidatePath("/workflow");
  return { error: null };
}

export async function deleteWorkflowDefinition(definitionId: string) {
  const org = await getCurrentOrg();
  if (!org) return;

  const supabase = await createClient();
  await supabase.from("workflow_definitions").delete().eq("id", definitionId).eq("org_id", org.orgId);

  revalidatePath("/workflow");
}

export async function startWorkflowInstance(
  _prev: WorkflowFormState,
  formData: FormData
): Promise<WorkflowFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };

  const workflowDefinitionId = String(formData.get("workflow_definition_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!workflowDefinitionId) return { error: "Choose a workflow." };
  if (!title) return { error: "Give this run a title." };

  const supabase = await createClient();

  const { data: firstStage } = await supabase
    .from("workflow_stages")
    .select("id")
    .eq("workflow_definition_id", workflowDefinitionId)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: instance, error } = await supabase
    .from("workflow_instances")
    .insert({
      org_id: org.orgId,
      workflow_definition_id: workflowDefinitionId,
      current_stage_id: firstStage?.id ?? null,
      title,
      created_by: org.userId,
    })
    .select("id")
    .single();

  if (error || !instance) return { error: error?.message ?? "Could not start the workflow." };

  await supabase.from("workflow_instance_events").insert({
    org_id: org.orgId,
    workflow_instance_id: instance.id,
    from_stage_id: null,
    to_stage_id: firstStage?.id ?? null,
    note: "Workflow started",
    created_by: org.userId,
  });

  revalidatePath("/workflow");
  return { error: null };
}

export async function advanceWorkflowInstance(instanceId: string) {
  const org = await getCurrentOrg();
  if (!org) return;

  const supabase = await createClient();

  const { data: instance } = await supabase
    .from("workflow_instances")
    .select("id, workflow_definition_id, current_stage_id, status")
    .eq("id", instanceId)
    .eq("org_id", org.orgId)
    .single();

  if (!instance || instance.status !== "active") return;

  const { data: stages } = await supabase
    .from("workflow_stages")
    .select("id, position")
    .eq("workflow_definition_id", instance.workflow_definition_id)
    .order("position", { ascending: true });

  if (!stages || stages.length === 0) return;

  const currentIndex = stages.findIndex((s) => s.id === instance.current_stage_id);
  const nextStage = stages[currentIndex + 1];
  if (!nextStage) return;

  await supabase
    .from("workflow_instances")
    .update({ current_stage_id: nextStage.id, updated_at: new Date().toISOString() })
    .eq("id", instanceId);

  await supabase.from("workflow_instance_events").insert({
    org_id: org.orgId,
    workflow_instance_id: instanceId,
    from_stage_id: instance.current_stage_id,
    to_stage_id: nextStage.id,
    created_by: org.userId,
  });

  revalidatePath("/workflow");
  revalidatePath(`/workflow/${instanceId}`);
}

export async function completeWorkflowInstance(instanceId: string) {
  const org = await getCurrentOrg();
  if (!org) return;

  const supabase = await createClient();
  await supabase
    .from("workflow_instances")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", instanceId)
    .eq("org_id", org.orgId)
    .eq("status", "active");

  revalidatePath("/workflow");
  revalidatePath(`/workflow/${instanceId}`);
}

export async function cancelWorkflowInstance(instanceId: string) {
  const org = await getCurrentOrg();
  if (!org) return;

  const supabase = await createClient();
  await supabase
    .from("workflow_instances")
    .update({ status: "cancelled" })
    .eq("id", instanceId)
    .eq("org_id", org.orgId)
    .eq("status", "active");

  revalidatePath("/workflow");
  revalidatePath(`/workflow/${instanceId}`);
}

export async function createWorkflowTask(
  _prev: WorkflowFormState,
  formData: FormData
): Promise<WorkflowFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };

  const instanceId = String(formData.get("workflow_instance_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const assigneeId = String(formData.get("assignee_id") ?? "").trim();
  const dueAt = String(formData.get("due_at") ?? "").trim();
  if (!instanceId) return { error: "Missing workflow run." };
  if (!title) return { error: "Give the task a title." };

  const supabase = await createClient();

  const { data: instance } = await supabase
    .from("workflow_instances")
    .select("current_stage_id")
    .eq("id", instanceId)
    .eq("org_id", org.orgId)
    .single();

  const { error } = await supabase.from("workflow_tasks").insert({
    org_id: org.orgId,
    workflow_instance_id: instanceId,
    stage_id: instance?.current_stage_id ?? null,
    title,
    assignee_id: assigneeId || null,
    due_at: dueAt ? new Date(dueAt).toISOString() : null,
    created_by: org.userId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/workflow/${instanceId}`);
  revalidatePath("/workflow");
  return { error: null };
}

export async function updateWorkflowTaskStatus(taskId: string, status: string, instanceId: string) {
  const org = await getCurrentOrg();
  if (!org) return;
  if (!TASK_STATUSES.has(status as WorkflowTaskStatus)) return;

  const supabase = await createClient();
  await supabase
    .from("workflow_tasks")
    .update({
      status: status as WorkflowTaskStatus,
      completed_at: status === "done" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("org_id", org.orgId);

  revalidatePath(`/workflow/${instanceId}`);
  revalidatePath("/workflow");
}

export async function deleteWorkflowTask(taskId: string, instanceId: string) {
  const org = await getCurrentOrg();
  if (!org) return;

  const supabase = await createClient();
  await supabase.from("workflow_tasks").delete().eq("id", taskId).eq("org_id", org.orgId);

  revalidatePath(`/workflow/${instanceId}`);
  revalidatePath("/workflow");
}
