"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { runPipeline, undoPipelineRun, type PipelineRunResult, type UndoRunResult } from "@/lib/etl/engine";
import { getConnectorAdapter, type ExtractedRecord } from "@/lib/connectors";
import { suggestMapping, type SuggestMappingResult } from "@/lib/etl/suggestMapping";

// maxDuration for the Server Actions in this file is set as route segment
// config on pipelines/[id]/page.tsx, not here — a "use server" file can only
// export server actions, and adding a plain constant export breaks Next's
// server-actions compiler for the whole module.

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

export async function updatePipeline(
  pipelineId: string,
  _prev: PipelineFormState,
  formData: FormData
): Promise<PipelineFormState> {
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
  const { error } = await supabase
    .from("pipelines")
    .update({
      name,
      source_id: sourceId,
      destination_id: destinationId || null,
      mapping,
      transform_steps: transformSteps,
      schedule: schedule || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pipelineId);

  if (error) return { error: error.message };

  revalidatePath(`/pipelines/${pipelineId}`);
  revalidatePath("/pipelines");
  redirect(`/pipelines/${pipelineId}`);
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

/**
 * Promotes a preview-only pipeline to a live one: sets its destination, then
 * immediately runs it for real so the caller finds out right away whether
 * the destination actually works, rather than saving and leaving them to
 * separately click "Run now".
 */
export async function promoteToLive(pipelineId: string, destinationId: string): Promise<PipelineRunResult> {
  if (!destinationId) throw new Error("Choose a destination to promote to.");

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("pipelines")
    .update({ destination_id: destinationId })
    .eq("id", pipelineId);

  if (updateError) throw new Error(updateError.message);

  const { data: pipeline, error } = await supabase
    .from("pipelines")
    .select("id, org_id, source_id, destination_id, mapping, transform_steps")
    .eq("id", pipelineId)
    .single();

  if (error || !pipeline) throw new Error("Pipeline not found.");

  const result = await runPipeline(supabase, pipeline, "manual");

  revalidatePath(`/pipelines/${pipelineId}`);
  revalidatePath("/pipelines");
  revalidatePath("/dashboard");

  return result;
}

export async function undoRun(runId: string): Promise<UndoRunResult> {
  const supabase = await createClient();
  const org = await getCurrentOrg();

  const { data: run } = await supabase.from("pipeline_runs").select("pipeline_id").eq("id", runId).single();
  const result = await undoPipelineRun(supabase, runId, org?.userId ?? null);

  if (run?.pipeline_id) {
    revalidatePath(`/pipelines/${run.pipeline_id}`);
  }
  revalidatePath("/pipelines");

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

export interface SuggestMappingState {
  error: string | null;
  result: SuggestMappingResult | null;
}

/**
 * Pulls a small sample from the source (and destination, if picked) via
 * their connector adapters and scores candidate field mappings from it —
 * lexical name similarity plus value-shape profiling, no external calls.
 * Config/credentials never leave the server; only field names, inferred
 * types, and a few sample values are returned to the client.
 */
export async function suggestPipelineMapping(
  sourceId: string,
  destinationId: string | null
): Promise<SuggestMappingState> {
  if (!sourceId) return { error: "Choose a source first.", result: null };

  const supabase = await createClient();

  const { data: source, error: sourceError } = await supabase
    .from("data_sources")
    .select("type, config")
    .eq("id", sourceId)
    .single();
  if (sourceError || !source) return { error: "Source data source not found.", result: null };

  const sourceAdapter = getConnectorAdapter(source.type);
  if (!sourceAdapter) return { error: `No connector adapter for source type "${source.type}".`, result: null };

  let sourceRecords;
  try {
    sourceRecords = (await sourceAdapter.extract(source.config ?? {})).records;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't sample the source.", result: null };
  }

  let destinationRecords: ExtractedRecord[] | null = null;
  if (destinationId) {
    const { data: destination } = await supabase
      .from("data_sources")
      .select("type, config")
      .eq("id", destinationId)
      .single();

    const destinationAdapter = destination ? getConnectorAdapter(destination.type) : null;
    if (destination && destinationAdapter) {
      try {
        destinationRecords = (await destinationAdapter.extract(destination.config ?? {})).records;
      } catch {
        // A destination that can't be sampled (write-only, unreachable for a
        // read) just falls back to name-cleanup suggestions — not a hard error.
        destinationRecords = null;
      }
    }
  }

  if (sourceRecords.length === 0) {
    return { error: "The source returned no sample records to profile.", result: null };
  }

  return { error: null, result: suggestMapping(sourceRecords, destinationRecords) };
}
