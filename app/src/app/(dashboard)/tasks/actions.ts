"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import type { EnhancementTaskPriority, EnhancementTaskStatus } from "@/types/database";

export interface TaskFormState {
  error: string | null;
}

export async function createTask(
  _prev: TaskFormState,
  formData: FormData
): Promise<TaskFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Give the task a title." };

  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium") as EnhancementTaskPriority;
  const assigneeId = String(formData.get("assignee_id") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.from("enhancement_tasks").insert({
    org_id: org.orgId,
    title,
    description: description || null,
    priority,
    assignee_id: assigneeId || null,
    created_by: org.userId,
  });

  if (error) return { error: error.message };

  revalidatePath("/tasks");
  return { error: null };
}

export async function updateTaskStatus(taskId: string, status: EnhancementTaskStatus) {
  const org = await getCurrentOrg();
  if (!org) return;

  const supabase = await createClient();
  await supabase.from("enhancement_tasks").update({ status }).eq("id", taskId);

  revalidatePath("/tasks");
}

export async function updateTaskPriority(taskId: string, priority: EnhancementTaskPriority) {
  const org = await getCurrentOrg();
  if (!org) return;

  const supabase = await createClient();
  await supabase.from("enhancement_tasks").update({ priority }).eq("id", taskId);

  revalidatePath("/tasks");
}

export async function updateTaskAssignee(taskId: string, assigneeId: string) {
  const org = await getCurrentOrg();
  if (!org) return;

  const supabase = await createClient();
  await supabase
    .from("enhancement_tasks")
    .update({ assignee_id: assigneeId || null })
    .eq("id", taskId);

  revalidatePath("/tasks");
}

export async function updateTaskNotes(taskId: string, notes: string) {
  const org = await getCurrentOrg();
  if (!org) return;

  const supabase = await createClient();
  await supabase
    .from("enhancement_tasks")
    .update({ notes: notes.trim() || null })
    .eq("id", taskId);

  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
  const org = await getCurrentOrg();
  if (!org) return;

  const supabase = await createClient();
  await supabase.from("enhancement_tasks").delete().eq("id", taskId);

  revalidatePath("/tasks");
}
