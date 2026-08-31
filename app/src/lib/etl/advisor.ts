import type { PipelineRunStatus } from "@/types/database";

export type AdvisorySeverity = "critical" | "warning" | "info";

export interface PipelineAdvisory {
  pipelineId: string;
  pipelineName: string;
  severity: AdvisorySeverity;
  message: string;
}

export interface AdvisorPipeline {
  id: string;
  name: string;
  is_active: boolean;
  schedule: string | null;
}

export interface AdvisorRun {
  status: PipelineRunStatus;
  started_at: string | null;
  created_at: string;
}

const STUCK_RUN_THRESHOLD_MS = 10 * 60 * 1000; // matches the Vercel function timeout this can indicate
const FAILURE_STREAK_LENGTH = 3;

const FAILED_STATUSES: PipelineRunStatus[] = ["failed", "partial"];

/**
 * Derives advisories from a pipeline's `is_active`/`schedule` plus its most
 * recent runs (already sorted newest-first, capped per pipeline by the
 * caller) — no new storage, everything here is computed from data the app
 * already has.
 */
export function getPipelineAdvisories(
  pipelines: AdvisorPipeline[],
  runsByPipeline: Map<string, AdvisorRun[]>,
  now: Date = new Date()
): PipelineAdvisory[] {
  const advisories: PipelineAdvisory[] = [];

  for (const pipeline of pipelines) {
    const runs = runsByPipeline.get(pipeline.id) ?? [];
    const latest = runs[0];

    if (latest?.status === "running" && latest.started_at) {
      const ageMs = now.getTime() - new Date(latest.started_at).getTime();
      if (ageMs > STUCK_RUN_THRESHOLD_MS) {
        advisories.push({
          pipelineId: pipeline.id,
          pipelineName: pipeline.name,
          severity: "critical",
          message: `Latest run has been "running" for ${formatDuration(ageMs)} — it likely hit a function timeout and never finished.`,
        });
      }
    }

    if (runs.length > 0 && !runs.some((r) => r.status === "succeeded")) {
      advisories.push({
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        severity: "warning",
        message: `Has never succeeded in its last ${runs.length} run${runs.length === 1 ? "" : "s"}.`,
      });
    } else if (
      runs.length >= FAILURE_STREAK_LENGTH &&
      runs.slice(0, FAILURE_STREAK_LENGTH).every((r) => FAILED_STATUSES.includes(r.status))
    ) {
      advisories.push({
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        severity: "warning",
        message: `The last ${FAILURE_STREAK_LENGTH} runs all failed or partially failed.`,
      });
    }

    if (pipeline.is_active && runs.length === 0) {
      advisories.push({
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        severity: "info",
        message: "Active but has never been run.",
      });
    } else if (pipeline.is_active && !pipeline.schedule) {
      advisories.push({
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        severity: "info",
        message: "No schedule set — this pipeline only runs when triggered manually or via the API.",
      });
    }
  }

  const severityRank: Record<AdvisorySeverity, number> = { critical: 0, warning: 1, info: 2 };
  return advisories.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
