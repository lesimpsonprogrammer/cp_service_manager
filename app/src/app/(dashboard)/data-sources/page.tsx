import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { getConnectorDefinition } from "@/lib/connectors/registry";

export default async function DataSourcesPage() {
  const supabase = await createClient();
  const { data: sources } = await supabase
    .from("data_sources")
    .select("id, name, type, status, last_synced_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Data sources"
        description="Every spreadsheet, HCM, ERP, database, and API connection in this workspace."
        action={
          <Link href="/data-sources/new">
            <Button>+ Add data source</Button>
          </Link>
        }
      />

      {sources && sources.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Last synced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sources.map((source) => (
                  <tr key={source.id} className="hover:bg-surface-2/60">
                    <td className="px-5 py-3">
                      <Link href={`/data-sources/${source.id}`} className="font-medium text-foreground hover:text-brand">
                        {source.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {getConnectorDefinition(source.type)?.label ?? source.type}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={source.status} />
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {source.last_synced_at ? new Date(source.last_synced_at).toLocaleString() : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon="⇄"
          title="No data sources yet"
          description="Connect a CSV, Google Sheet, REST API, database, HCM, or ERP system to start extracting data."
          action={
            <Link href="/data-sources/new">
              <Button>Add your first data source</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
