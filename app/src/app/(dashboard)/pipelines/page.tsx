import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { PipelineAdvisorPanel } from "@/components/pipelines/PipelineAdvisorPanel";
import { getPipelineAdvisories, type AdvisorRun } from "@/lib/etl/advisor";

// How many of a pipeline's most recent runs the advisor looks at per
// pipeline, and how many total runs it pulls across the org to build that
// (org-wide, not per-pipeline, so this is a rough cap — fine at this scale).
const RUNS_PER_PIPELINE = 5;
const RECENT_RUNS_LIMIT = 300;

export default async function PipelinesPage() {
  const supabase = await createClient();
  const { data: pipelines } = await supabase
    .from("pipelines")
    .select("id, name, is_active, schedule, source:data_sources!pipelines_source_id_fkey(name), destination:data_sources!pipelines_destination_id_fkey(name)")
    .order("created_at", { ascending: false });

  const { data: recentRuns } = await supabase
    .from("pipeline_runs")
    .select("pipeline_id, status, started_at, created_at")
    .order("created_at", { ascending: false })
    .limit(RECENT_RUNS_LIMIT);

  const runsByPipeline = new Map<string, AdvisorRun[]>();
  for (const run of recentRuns ?? []) {
    const existing = runsByPipeline.get(run.pipeline_id) ?? [];
    if (existing.length < RUNS_PER_PIPELINE) {
      existing.push({ status: run.status, started_at: run.started_at, created_at: run.created_at });
      runsByPipeline.set(run.pipeline_id, existing);
    }
  }

  const advisories = getPipelineAdvisories(pipelines ?? [], runsByPipeline);

  return (
    <div>
      <PageHeader
        title="Pipelines"
        description="Extract, transform, and load data on demand or on a schedule."
        action={
          <Link href="/pipelines/new">
            <Button>+ New pipeline</Button>
          </Link>
        }
      />

      {pipelines && pipelines.length > 0 && <PipelineAdvisorPanel advisories={advisories} />}

      {pipelines && pipelines.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Source → Destination</th>
                  <th className="px-5 py-3 font-medium">Schedule</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pipelines.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-2/60">
                    <td className="px-5 py-3">
                      <Link href={`/pipelines/${p.id}`} className="font-medium text-foreground hover:text-brand">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {(p as unknown as { source: { name: string } | null }).source?.name ?? "—"} →{" "}
                      {(p as unknown as { destination: { name: string } | null }).destination?.name ?? "Preview only"}
                    </td>
                    <td className="px-5 py-3 text-muted">{p.schedule || "Manual"}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.is_active ? "active" : "disconnected"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon="⇉"
          title="No pipelines yet"
          description="A pipeline moves records from a source connector to a destination, applying field mapping and transforms along the way."
          action={
            <Link href="/pipelines/new">
              <Button>Create your first pipeline</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
