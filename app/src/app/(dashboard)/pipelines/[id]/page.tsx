import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { RunPipelineButton } from "@/components/pipelines/RunPipelineButton";
import type { FieldMapping, TransformStep } from "@/lib/etl/transforms";

export default async function PipelineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: pipeline } = await supabase
    .from("pipelines")
    .select(
      "*, source:data_sources!pipelines_source_id_fkey(id, name), destination:data_sources!pipelines_destination_id_fkey(id, name)"
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
  const destination = (pipeline as unknown as { destination: { name: string } | null }).destination;
  const mapping = (pipeline.mapping ?? []) as FieldMapping[];
  const transformSteps = (pipeline.transform_steps ?? []) as unknown as TransformStep[];

  return (
    <div>
      <PageHeader
        title={pipeline.name}
        description={`${source?.name ?? "Unknown source"} → ${destination?.name ?? "Preview only"}`}
        action={<RunPipelineButton pipelineId={pipeline.id} />}
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

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Run history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {runs && runs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Started</th>
                    <th className="px-5 py-2.5 font-medium">Trigger</th>
                    <th className="px-5 py-2.5 font-medium">Extracted</th>
                    <th className="px-5 py-2.5 font-medium">Loaded</th>
                    <th className="px-5 py-2.5 font-medium">Failed</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {runs.map((run) => (
                    <tr key={run.id}>
                      <td className="px-5 py-2.5 text-muted">
                        {run.started_at ? new Date(run.started_at).toLocaleString() : "—"}
                      </td>
                      <td className="px-5 py-2.5 text-muted">{run.triggered_by}</td>
                      <td className="px-5 py-2.5">{run.records_extracted}</td>
                      <td className="px-5 py-2.5">{run.records_loaded}</td>
                      <td className="px-5 py-2.5">{run.records_failed}</td>
                      <td className="px-5 py-2.5">
                        <StatusBadge status={run.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-4 text-sm text-muted">No runs yet — click &ldquo;Run now&rdquo; to trigger one.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
