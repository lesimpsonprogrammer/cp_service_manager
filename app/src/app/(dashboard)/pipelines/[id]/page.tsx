import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RunPipelineButton } from "@/components/pipelines/RunPipelineButton";
import { PipelineRunHistory } from "@/components/pipelines/PipelineRunHistory";
import { PromoteToLivePanel } from "@/components/pipelines/PromoteToLivePanel";
import type { FieldMapping, TransformStep } from "@/lib/etl/transforms";

// Extract + per-record load can run past Vercel's default serverless
// timeout on anything but a trivial source, which kills the function before
// the run's finish() step ever marks it succeeded/failed — leaving the row
// stuck on "running" indefinitely. Applies to the Server Actions this page's
// buttons invoke (runPipelineNow, promoteToLive, undoRun).
export const maxDuration = 60;

export default async function PipelineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: pipeline } = await supabase
    .from("pipelines")
    .select(
      "*, source:data_sources!pipelines_source_id_fkey(id, name), destination:data_sources!pipelines_destination_id_fkey(id, name, type)"
    )
    .eq("id", id)
    .single();

  if (!pipeline) notFound();

  const { data: runs } = await supabase
    .from("pipeline_runs")
    .select("*")
    .eq("pipeline_id", pipeline.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const source = (pipeline as unknown as { source: { name: string } | null }).source;
  const destination = (pipeline as unknown as { destination: { name: string; type: string } | null }).destination;
  const mapping = (pipeline.mapping ?? []) as FieldMapping[];
  const transformSteps = (pipeline.transform_steps ?? []) as unknown as TransformStep[];

  let dataSources: { id: string; name: string; type: string }[] = [];
  if (!pipeline.destination_id) {
    const { data } = await supabase
      .from("data_sources")
      .select("id, name, type")
      .neq("id", pipeline.source_id)
      .order("created_at", { ascending: false });
    dataSources = data ?? [];
  }

  return (
    <div>
      <PageHeader
        title={pipeline.name}
        description={`${source?.name ?? "Unknown source"} → ${destination?.name ?? "Preview only"}`}
        action={
          <div className="flex items-center gap-2">
            <Link href={`/pipelines/${pipeline.id}/edit`}>
              <Button variant="secondary" size="sm">
                Edit
              </Button>
            </Link>
            <RunPipelineButton pipelineId={pipeline.id} />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Field mapping</CardTitle>
          </CardHeader>
          <CardContent>
            {mapping.length > 0 ? (
              <ul className="space-y-1.5 text-sm">
                {mapping.map((m, i) => (
                  <li key={i} className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-muted">{m.source}</span>
                    <span>→</span>
                    <span className="text-foreground">{m.target}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Passing every extracted field through unchanged.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transform steps</CardTitle>
          </CardHeader>
          <CardContent>
            {transformSteps.length > 0 ? (
              <ul className="space-y-1.5 text-sm">
                {transformSteps.map((s, i) => (
                  <li key={i} className="text-xs text-foreground">
                    <span className="font-mono text-muted">{s.op}</span>{" "}
                    {s.field && <span className="font-mono">{s.field}</span>}
                    {s.value && <span className="font-mono text-muted"> = {s.value}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No transform steps configured.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {!pipeline.destination_id && dataSources.length > 0 && (
        <PromoteToLivePanel pipelineId={pipeline.id} dataSources={dataSources} />
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Run history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <PipelineRunHistory
            runs={runs ?? []}
            destinationType={destination?.type ?? null}
            hasDestination={!!pipeline.destination_id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
