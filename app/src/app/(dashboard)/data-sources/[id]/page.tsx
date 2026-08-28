import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getConnectorDefinition } from "@/lib/connectors/registry";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { TestConnectionButton } from "@/components/connectors/TestConnectionButton";
import { DeleteDataSourceButton } from "@/components/connectors/DeleteDataSourceButton";

export default async function DataSourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: source } = await supabase
    .from("data_sources")
    .select("*")
    .eq("id", id)
    .single();

  if (!source) notFound();

  const { data: pipelines } = await supabase
    .from("pipelines")
    .select("id, name, is_active")
    .or(`source_id.eq.${source.id},destination_id.eq.${source.id}`);

  const definition = getConnectorDefinition(source.type);

  return (
    <div>
      <PageHeader
        title={source.name}
        description={definition?.label ?? source.type}
        action={<DeleteDataSourceButton dataSourceId={source.id} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {definition?.fields.map((field) => {
              const value = (source.config as Record<string, unknown>)?.[field.key];
              if (value === undefined) return null;
              return (
                <div key={field.key} className="flex items-center justify-between border-b border-border/60 pb-2 text-sm last:border-0 last:pb-0">
                  <span className="text-muted">{field.label}</span>
                  <span className="max-w-xs truncate font-mono text-xs text-foreground">
                    {field.secret ? "••••••••" : String(value)}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusBadge status={source.status} />
            <p className="text-xs text-muted">
              Last synced:{" "}
              {source.last_synced_at ? new Date(source.last_synced_at).toLocaleString() : "Never"}
            </p>
            <TestConnectionButton dataSourceId={source.id} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Pipelines using this source</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pipelines && pipelines.length > 0 ? (
            <ul className="divide-y divide-border">
              {pipelines.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <Link href={`/pipelines/${p.id}`} className="font-medium text-foreground hover:text-brand">
                    {p.name}
                  </Link>
                  <StatusBadge status={p.is_active ? "active" : "disconnected"} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-muted">No pipelines reference this data source yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
