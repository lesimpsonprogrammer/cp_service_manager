import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { hoursAgoIso } from "@/lib/utils/time";

export default async function DashboardOverviewPage() {
  const org = await getCurrentOrg();
  const supabase = await createClient();

  const since24h = hoursAgoIso(24);

  const [{ count: sourcesCount }, { count: activePipelines }, { count: runsToday }, recentRuns, recentSources] =
    await Promise.all([
      supabase.from("data_sources").select("id", { count: "exact", head: true }),
      supabase
        .from("pipelines")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("pipeline_runs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since24h),
      supabase
        .from("pipeline_runs")
        .select("id, status, records_loaded, created_at, pipelines ( name )")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("data_sources")
        .select("id, name, type, status")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  return (
    <div>
      <PageHeader
        title={`Welcome back${org?.userEmail ? "" : ""}`}
        description="Here's what's happening across your connectors and pipelines."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Data sources" value={sourcesCount ?? 0} />
        <StatCard label="Active pipelines" value={activePipelines ?? 0} tone="brand" />
        <StatCard label="Runs (24h)" value={runsToday ?? 0} />
        <StatCard label="Workspace role" value={org?.role ?? "—"} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent pipeline runs</CardTitle>
            <Link href="/pipelines" className="text-xs text-brand hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentRuns.data && recentRuns.data.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentRuns.data.map((run) => (
                  <li key={run.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium text-foreground">
                        {(run as unknown as { pipelines: { name: string } | null }).pipelines?.name ??
                          "Pipeline"}
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(run.created_at).toLocaleString()} · {run.records_loaded} loaded
                      </p>
                    </div>
                    <StatusBadge status={run.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5">
                <EmptyState
                  icon="⇉"
                  title="No pipeline runs yet"
                  description="Runs will show up here once you trigger or schedule a pipeline."
                  action={
                    <Link href="/pipelines/new">
                      <Button size="sm">Create a pipeline</Button>
                    </Link>
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent data sources</CardTitle>
            <Link href="/data-sources" className="text-xs text-brand hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentSources.data && recentSources.data.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentSources.data.map((source) => (
                  <li key={source.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium text-foreground">{source.name}</p>
                      <p className="text-xs capitalize text-muted">{source.type.replace(/_/g, " ")}</p>
                    </div>
                    <StatusBadge status={source.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5">
                <EmptyState
                  icon="⇄"
                  title="No data sources yet"
                  description="Connect a spreadsheet, HCM, ERP, database, or API to get started."
                  action={
                    <Link href="/data-sources/new">
                      <Button size="sm">Add a data source</Button>
                    </Link>
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
