import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { getConnectorDefinition } from "@/lib/connectors/registry";

export default async function ClientDataSourcesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: dataSources } = await supabase
    .from("data_sources")
    .select("id, name, type, status")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data sources for this client</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {dataSources && dataSources.length > 0 ? (
          <ul className="divide-y divide-border">
            {dataSources.map((source) => (
              <li key={source.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <Link href={`/data-sources/${source.id}`} className="font-medium text-foreground hover:text-brand">
                  {source.name}
                  <span className="ml-2 text-xs text-muted">
                    {getConnectorDefinition(source.type)?.label ?? source.type}
                  </span>
                </Link>
                <StatusBadge status={source.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-4 text-sm text-muted">
            No data sources are linked to this client yet.{" "}
            <Link href="/data-sources/new" className="text-brand hover:underline">
              Connect one
            </Link>
            .
          </p>
        )}
      </CardContent>
    </Card>
  );
}
