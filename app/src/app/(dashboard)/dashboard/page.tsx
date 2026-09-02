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
import { Greeting } from "@/components/dashboard/Greeting";
import { ActionCenterWidget } from "@/components/dashboard/ActionCenterWidget";
import { getOrgMembers } from "@/lib/org/getOrgMembers";

export default async function DashboardOverviewPage() {
  const org = await getCurrentOrg();
  const supabase = await createClient();

  const since24h = hoursAgoIso(24);
  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: sourcesCount },
    { count: activePipelines },
    { count: runsToday },
    recentRuns,
    recentSources,
    profile,
    pendingTimecards,
    outstandingInvoices,
    openTasks,
    members,
  ] = await Promise.all([
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
    org
      ? supabase.from("profiles").select("full_name").eq("id", org.userId).maybeSingle()
      : Promise.resolve({ data: null }),
    org
      ? supabase
          .from("timecards")
          .select("id, client_id, status, period_start, period_end, total_hours, clients ( name )")
          .eq("org_id", org.orgId)
          .in("status", ["draft", "internally_approved"])
          .order("created_at", { ascending: true })
          .returns<
            {
              id: string;
              client_id: string;
              status: "draft" | "internally_approved";
              period_start: string;
              period_end: string;
              total_hours: number;
              clients: { name: string } | null;
            }[]
          >()
      : Promise.resolve({ data: [] }),
    org
      ? supabase
          .from("invoices")
          .select("id, client_id, invoice_number, status, total, due_date, clients ( name )")
          .eq("org_id", org.orgId)
          .in("status", ["draft", "sent", "overdue"])
          .order("due_date", { ascending: true, nullsFirst: false })
          .returns<
            {
              id: string;
              client_id: string;
              invoice_number: string;
              status: string;
              total: number;
              due_date: string | null;
              clients: { name: string } | null;
            }[]
          >()
      : Promise.resolve({ data: [] }),
    org
      ? supabase
          .from("workflow_tasks")
          .select("id, title, status, due_at, assignee_id, workflow_instance_id, workflow_instances ( title )")
          .eq("org_id", org.orgId)
          .in("status", ["pending", "in_progress"])
          .order("due_at", { ascending: true, nullsFirst: false })
          .limit(50)
          .returns<
            {
              id: string;
              title: string;
              status: string;
              due_at: string | null;
              assignee_id: string | null;
              workflow_instance_id: string;
              workflow_instances: { title: string } | null;
            }[]
          >()
      : Promise.resolve({ data: [] }),
    org ? getOrgMembers(org.orgId) : Promise.resolve([]),
  ]);

  const displayName = profile.data?.full_name?.trim() || org?.userEmail?.split("@")[0] || null;
  const memberNameById = new Map(members.map((m) => [m.userId, m.fullName]));

  return (
    <div>
      <PageHeader
        title={<Greeting name={displayName} />}
        description="Here's what's happening across your connectors and pipelines."
      />

      <ActionCenterWidget
        timecards={(pendingTimecards.data ?? []).map((t) => ({
          id: t.id,
          clientId: t.client_id,
          clientName: t.clients?.name ?? "Client",
          status: t.status,
          periodStart: t.period_start,
          periodEnd: t.period_end,
          totalHours: t.total_hours,
        }))}
        invoices={(outstandingInvoices.data ?? [])
          .filter((i) => i.status === "draft" || i.status === "overdue" || (i.due_date && i.due_date < today))
          .map((i) => ({
            id: i.id,
            clientId: i.client_id,
            clientName: i.clients?.name ?? "Client",
            invoiceNumber: i.invoice_number,
            status: i.status,
            total: i.total,
            dueDate: i.due_date,
            isOverdue: i.status === "overdue" || (i.status === "sent" && !!i.due_date && i.due_date < today),
          }))}
        tasks={(openTasks.data ?? []).map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          dueAt: t.due_at,
          instanceId: t.workflow_instance_id,
          instanceTitle: t.workflow_instances?.title ?? "Workflow run",
          assigneeName: t.assignee_id ? memberNameById.get(t.assignee_id) ?? "Former teammate" : null,
        }))}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
