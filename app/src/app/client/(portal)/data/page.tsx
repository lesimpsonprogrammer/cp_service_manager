import { createClient } from "@/lib/supabase/server";
import { getCurrentClientPortalUser } from "@/lib/portal/getCurrentClientPortalUser";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function ClientDataPage() {
  const clientUser = await getCurrentClientPortalUser();
  if (!clientUser) return null;

  const supabase = await createClient();

  const { data: sources } = await supabase
    .from("data_sources")
    .select("id, name, type, status, last_synced_at")
    .eq("client_id", clientUser.clientId)
    .order("name", { ascending: true });

  const sourceIds = (sources ?? []).map((s) => s.id);

  const { data: pipelines } = sourceIds.length
    ? await supabase.from("pipelines").select("id, name, source_id, is_active").in("source_id", sourceIds)
    : { data: [] as { id: string; name: string; source_id: string; is_active: boolean }[] };

  const pipelineIds = (pipelines ?? []).map((p) => p.id);

  const { data: runs } = pipelineIds.length
    ? await supabase
        .from("pipeline_runs")
        .select(
          "id, run_number, pipeline_id, status, records_loaded, records_failed, error, finished_at, started_at, output_sample, output_truncated"
        )
        .in("pipeline_id", pipelineIds)
        .order("started_at", { ascending: false })
        .limit(25)
    : { data: [] as never[] };

  const pipelineName = new Map((pipelines ?? []).map((p) => [p.id, p.name]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data & syncs"
        description="Every connection we've set up for you, and the history of every sync — just like a Fivetran or Snowflake connector dashboard."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {(sources ?? []).length === 0 ? (
          <EmptyState title="No data sources yet" description="We'll show your connections here as soon as they're set up." />
        ) : (
          (sources ?? []).map((source) => (
            <Card key={source.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{source.name}</span>
                  <StatusBadge status={source.status} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted">
                <p className="capitalize">{source.type.replace(/_/g, " ")}</p>
                <p>
                  Last synced:{" "}
                  {source.last_synced_at ? new Date(source.last_synced_at).toLocaleString() : "Never yet"}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sync history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(runs ?? []).length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">No syncs have run yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-2 font-medium">Run</th>
                    <th className="px-5 py-2 font-medium">Pipeline</th>
                    <th className="px-5 py-2 font-medium">Status</th>
                    <th className="px-5 py-2 font-medium">Records</th>
                    <th className="px-5 py-2 font-medium">Finished</th>
                    <th className="px-5 py-2 font-medium">Cleaned data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(runs ?? []).map((run) => {
                    const outputSample = run.output_sample as Record<string, unknown>[] | null;
                    return (
                      <tr key={run.id}>
                        <td className="px-5 py-2 font-mono text-xs text-foreground">{run.run_number}</td>
                        <td className="px-5 py-2 text-foreground">{pipelineName.get(run.pipeline_id) ?? "—"}</td>
                        <td className="px-5 py-2">
                          <StatusBadge status={run.status} />
                        </td>
                        <td className="px-5 py-2 text-muted">
                          {run.records_loaded}
                          {run.records_failed > 0 ? ` (${run.records_failed} failed)` : ""}
                        </td>
                        <td className="px-5 py-2 text-muted">
                          {run.finished_at ? new Date(run.finished_at).toLocaleString() : "In progress"}
                        </td>
                        <td className="px-5 py-2">
                          {outputSample && outputSample.length > 0 ? (
                            <a
                              href={`/client/data/runs/${run.id}/csv`}
                              className="text-sm font-medium text-brand underline underline-offset-2"
                            >
                              Download CSV{run.output_truncated ? ` (first ${outputSample.length})` : ""}
                            </a>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
