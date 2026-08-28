"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { runPipeline, type PipelineRunResult } from "@/lib/etl/engine";

export interface PipelineFormState {
  error: string | null;
}

export async function createPipeline(
  _prev: PipelineFormState,
  formData: FormData
): Promise<PipelineFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };

  const name = String(formData.get("name") ?? "").trim();
  const sourceId = String(formData.get("source_id") ?? "");
  const destinationId = String(formData.get("destination_id") ?? "");
  const schedule = String(formData.get("schedule") ?? "").trim();

  if (!name) return { error: "Give this pipeline a name." };
  if (!sourceId) return { error: "Choose a source data source." };

  let mapping = [];
  let transformSteps = [];
  try {
    mapping = JSON.parse(String(formData.get("mapping_json") ?? "[]"));
    transformSteps = JSON.parse(String(formData.get("transform_json") ?? "[]"));
  } catch {
    return { error: "Invalid mapping or transform configuration." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pipelines")
    .insert({
      org_id: org.orgId,
      name,
      source_id: sourceId,
      destination_id: destinationId || null,
      mapping,
      transform_steps: transformSteps,
      schedule: schedule || null,
      created_by: org.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create pipeline." };
  }

  revalidatePath("/pipelines");
  redirect(`/pipelines/${data.id}`);
}

export async function runPipelineNow(pipelineId: string): Promise<PipelineRunResult> {
  const supabase = await createClient();
  const { data: pipeline, error } = await supabase
    .from("pipelines")
    .select("id, org_id, source_id, destination_id, mapping, transform_steps")
    .eq("id", pipelineId)
    .single();

  if (error || !pipeline) {
    throw new Error("Pipeline not found.");
  }

  const result = await runPipeline(supabase, pipeline, "manual");

  revalidatePath(`/pipelines/${pipelineId}`);
  revalidatePath("/pipelines");
  revalidatePath("/dashboard");

  return result;
}

export async function deletePipeline(pipelineId: string) {
  const supabase = await createClient();
  await supabase.from("pipelines").delete().eq("id", pipelineId);
  revalidatePath("/pipelines");
  redirect("/pipelines");
}

export async function togglePipelineActive(pipelineId: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("pipelines").update({ is_active: isActive }).eq("id", pipelineId);
  revalidatePath(`/pipelines/${pipelineId}`);
  revalidatePath("/pipelines");
}
