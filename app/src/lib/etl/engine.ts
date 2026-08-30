import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PipelineRunStatus } from "@/types/database";
import { getConnectorAdapter } from "@/lib/connectors";
import { dispatchEvent } from "@/lib/webhooks/dispatch";
import { sendPipelineRunClientEmail } from "@/lib/email/resend";
import { applyMapping, applyTransforms, type FieldMapping, type TransformStep } from "./transforms";

interface PipelineRow {
  id: string;
  org_id: string;
  source_id: string;
  destination_id: string | null;
  // Typed loosely here to match the jsonb columns as Supabase returns them —
  // callers pass the row straight from a `.select()`. Cast to FieldMapping[] /
  // TransformStep[] happens below, right before use.
  mapping: unknown;
  transform_steps: unknown;
}

export interface PipelineRunResult {
  runId: string;
  status: PipelineRunStatus;
  recordsExtracted: number;
  recordsLoaded: number;
  recordsFailed: number;
  error: string | null;
}

export interface UndoRunResult {
  status: "rolled_back" | "partial";
  deleted: number;
  failed: number;
  error: string | null;
}

// Bounded so a large source doesn't blow up the jsonb column or the run
// history UI. `SAMPLE_LIMIT` is purely for display; `LOAD_SNAPSHOT_LIMIT` is
// what a later "Undo load" can act on, so a load beyond this many records is
// only partially undoable — the UI surfaces that rather than hiding it.
const SAMPLE_LIMIT = 50;
const LOAD_SNAPSHOT_LIMIT = 500;

/**
 * Runs one pipeline end-to-end: extract from its source connector, apply
 * field mapping + transform steps, then load into its destination connector
 * (when one is configured — otherwise this behaves as a dry-run/preview and
 * every transformed record counts as "loaded"). Every run is recorded in
 * `pipeline_runs` regardless of outcome.
 */
export async function runPipeline(
  supabase: SupabaseClient<Database>,
  pipeline: PipelineRow,
  triggeredBy: "manual" | "schedule" | "webhook" | "api" = "manual"
): Promise<PipelineRunResult> {
  const startedAt = new Date().toISOString();
  const { data: run, error: runInsertError } = await supabase
    .from("pipeline_runs")
    .insert({
      pipeline_id: pipeline.id,
      org_id: pipeline.org_id,
      status: "running",
      triggered_by: triggeredBy,
      started_at: startedAt,
    })
    .select("id")
    .single();

  if (runInsertError || !run) {
    throw new Error(runInsertError?.message ?? "Failed to create pipeline run.");
  }

  const finish = async (
    result: Omit<PipelineRunResult, "runId">,
    records: { sample?: Record<string, unknown>[]; loaded?: Record<string, unknown>[] } = {}
  ) => {
    const { data: updatedRun } = await supabase
      .from("pipeline_runs")
      .update({
        status: result.status,
        records_extracted: result.recordsExtracted,
        records_loaded: result.recordsLoaded,
        records_failed: result.recordsFailed,
        error: result.error,
        sample_records: records.sample?.slice(0, SAMPLE_LIMIT) ?? [],
        loaded_records: records.loaded?.slice(0, LOAD_SNAPSHOT_LIMIT) ?? [],
        finished_at: new Date().toISOString(),
      })
      .eq("id", run.id)
      .select("run_number")
      .single();

    await dispatchEvent(supabase, pipeline.org_id, "pipeline.run.completed", {
      pipeline_id: pipeline.id,
      run_id: run.id,
      ...result,
    });

    await notifyClientOfRun(supabase, pipeline, updatedRun?.run_number ?? run.id, result);

    return { runId: run.id, ...result };
  };

  const { data: source } = await supabase
    .from("data_sources")
    .select("type, config")
    .eq("id", pipeline.source_id)
    .single();

  if (!source) {
    return finish({ status: "failed", recordsExtracted: 0, recordsLoaded: 0, recordsFailed: 0, error: "Source data source not found." });
  }

  const sourceAdapter = getConnectorAdapter(source.type);
  if (!sourceAdapter) {
    return finish({ status: "failed", recordsExtracted: 0, recordsLoaded: 0, recordsFailed: 0, error: `No connector adapter for source type "${source.type}".` });
  }

  let extracted;
  try {
    extracted = await sourceAdapter.extract(source.config ?? {});
  } catch (err) {
    return finish({
      status: "failed",
      recordsExtracted: 0,
      recordsLoaded: 0,
      recordsFailed: 0,
      error: err instanceof Error ? err.message : "Extraction failed.",
    });
  }

  const mapped = applyMapping(extracted.records, (pipeline.mapping as FieldMapping[]) ?? []);
  const transformed = applyTransforms(mapped, (pipeline.transform_steps as TransformStep[]) ?? []);

  if (!pipeline.destination_id) {
    return finish(
      {
        status: "succeeded",
        recordsExtracted: extracted.records.length,
        recordsLoaded: transformed.length,
        recordsFailed: 0,
        error: null,
      },
      { sample: transformed }
    );
  }

  const { data: destination } = await supabase
    .from("data_sources")
    .select("type, config")
    .eq("id", pipeline.destination_id)
    .single();

  if (!destination) {
    return finish(
      {
        status: "failed",
        recordsExtracted: extracted.records.length,
        recordsLoaded: 0,
        recordsFailed: transformed.length,
        error: "Destination data source not found.",
      },
      { sample: transformed }
    );
  }

  const destinationAdapter = getConnectorAdapter(destination.type);
  if (!destinationAdapter?.load) {
    return finish(
      {
        status: "partial",
        recordsExtracted: extracted.records.length,
        recordsLoaded: 0,
        recordsFailed: transformed.length,
        error: `"${destination.type}" can't be used as a pipeline destination yet.`,
      },
      { sample: transformed }
    );
  }

  try {
    const loadResult = await destinationAdapter.load(destination.config ?? {}, transformed);
    return finish(
      {
        status: loadResult.failed > 0 ? "partial" : "succeeded",
        recordsExtracted: extracted.records.length,
        recordsLoaded: loadResult.loaded,
        recordsFailed: loadResult.failed,
        error: loadResult.error ?? null,
      },
      { sample: transformed, loaded: transformed }
    );
  } catch (err) {
    return finish(
      {
        status: "failed",
        recordsExtracted: extracted.records.length,
        recordsLoaded: 0,
        recordsFailed: transformed.length,
        error: err instanceof Error ? err.message : "Load failed.",
      },
      { sample: transformed }
    );
  }
}

/**
 * Best-effort undo of a completed load: replays the run's `loaded_records`
 * snapshot through the destination adapter's `unload`, then marks the run
 * rolled back. Does nothing to `records_loaded`/`status` on the run row —
 * those stay as the historical record of what happened; `rolled_back_at`
 * is the marker that it was since undone.
 */
export async function undoPipelineRun(
  supabase: SupabaseClient<Database>,
  runId: string,
  userId: string | null
): Promise<UndoRunResult> {
  const { data: run, error: runError } = await supabase
    .from("pipeline_runs")
    .select("id, pipeline_id, loaded_records, rolled_back_at")
    .eq("id", runId)
    .single();

  if (runError || !run) throw new Error("Run not found.");
  if (run.rolled_back_at) throw new Error("This run has already been undone.");

  const loadedRecords = (run.loaded_records ?? []) as Record<string, unknown>[];
  if (loadedRecords.length === 0) throw new Error("This run has no loaded records to undo.");

  const { data: pipeline } = await supabase
    .from("pipelines")
    .select("destination_id")
    .eq("id", run.pipeline_id)
    .single();

  if (!pipeline?.destination_id) throw new Error("This pipeline no longer has a destination configured.");

  const { data: destination } = await supabase
    .from("data_sources")
    .select("type, config")
    .eq("id", pipeline.destination_id)
    .single();

  if (!destination) throw new Error("Destination data source not found.");

  const destinationAdapter = getConnectorAdapter(destination.type);
  if (!destinationAdapter?.unload) {
    throw new Error(`"${destination.type}" destinations don't support undoing a load yet.`);
  }

  const unloadResult = await destinationAdapter.unload(destination.config ?? {}, loadedRecords);

  await supabase
    .from("pipeline_runs")
    .update({ rolled_back_at: new Date().toISOString(), rolled_back_by: userId })
    .eq("id", runId);

  return {
    status: unloadResult.failed > 0 ? "partial" : "rolled_back",
    deleted: unloadResult.deleted,
    failed: unloadResult.failed,
    error: unloadResult.error ?? null,
  };
}

/**
 * Real-time email to the client's contact when one of their data sources
 * finishes syncing — the client portal itself updates live via Supabase
 * Realtime, this is the "check your email" companion channel.
 */
async function notifyClientOfRun(
  supabase: SupabaseClient<Database>,
  pipeline: PipelineRow,
  runNumber: string,
  result: Omit<PipelineRunResult, "runId">
) {
  const { data: source } = await supabase
    .from("data_sources")
    .select("name, client_id")
    .eq("id", pipeline.source_id)
    .single();

  if (!source?.client_id) return;

  const { data: client } = await supabase
    .from("clients")
    .select("name, primary_contact_email")
    .eq("id", source.client_id)
    .single();

  if (!client?.primary_contact_email) return;

  await sendPipelineRunClientEmail({
    to: client.primary_contact_email,
    clientName: client.name,
    dataSourceName: source.name,
    runNumber,
    status: result.status,
    recordsLoaded: result.recordsLoaded,
    error: result.error,
    portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/client/data`,
  });
}
