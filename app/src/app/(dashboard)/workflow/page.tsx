import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { WorkflowDefinitionsPanel } from "@/components/workflow/WorkflowDefinitionsPanel";
import { ActiveInstancesTable } from "@/components/workflow/ActiveInstancesTable";
import { MyTasksPanel } from "@/components/workflow/MyTasksPanel";
import type { OnboardingStage } from "@/types/database";

const STAGE_LABELS: Record<OnboardingStage, string> = {
  not_started: "Not started",
  contract_sent: "Contract sent",
  contract_signed: "Contract signed",
  in_progress: "Onboarding in progress",
  completed: "Completed",
};

// Ordered by how much attention each stage typically needs.
const STAGE_ORDER: OnboardingStage[] = [
  "contract_sent",
  "not_started",
  "in_progress",
  "contract_signed",
  "completed",
];

export default async function WorkflowPage() {
  const org = await getCurrentOrg();
  const supabase = await createClient();

  const { data: definitions } = org
    ? await supabase
        .from("workflow_definitions")
        .select("id, name, description, workflow_stages ( id )")
        .eq("org_id", org.orgId)
        .order("created_at", { ascending: false })
        .returns<{ id: string; name: string; description: string | null; workflow_stages: { id: string }[] }[]>()
    : { data: [] };

  const { data: instances } = org
    ? await supabase
        .from("workflow_instances")
        .select(
          "id, title, status, workflow_definitions ( name ), workflow_stages ( name ), workflow_tasks ( id, status )"
        )
        .eq("org_id", org.orgId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .returns<
          {
            id: string;
            title: string;
            status: string;
            workflow_definitions: { name: string } | null;
            workflow_stages: { name: string } | null;
            workflow_tasks: { id: string; status: string }[];
          }[]
        >()
    : { data: [] };

  const { data: myTasks } = org
    ? await supabase
        .from("workflow_tasks")
        .select("id, title, status, due_at, workflow_instance_id, workflow_instances ( title )")
        .eq("org_id", org.orgId)
        .eq("assignee_id", org.userId)
        .neq("status", "done")
        .order("due_at", { ascending: true, nullsFirst: false })
        .returns<
          {
            id: string;
            title: string;
            status: string;
            due_at: string | null;
            workflow_instance_id: string;
            workflow_instances: { title: string } | null;
          }[]
        >()
    : { data: [] };

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, onboarding_stage")
    .order("name", { ascending: true });

  const { data: contracts } = await supabase
    .from("client_contracts")
    .select("client_id, name, status, sent_at, signer_email")
    .order("created_at", { ascending: false });

  type ContractSummary = NonNullable<typeof contracts>[number];
  const latestContractByClient = new Map<string, ContractSummary>();
  for (const contract of contracts ?? []) {
    if (!latestContractByClient.has(contract.client_id)) {
      latestContractByClient.set(contract.client_id, contract);
    }
  }

  const sortedClients = [...(clients ?? [])].sort(
    (a, b) => STAGE_ORDER.indexOf(a.onboarding_stage) - STAGE_ORDER.indexOf(b.onboarding_stage)
  );

  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader
        title="Workflow Center"
        description="Define business processes as workflows, run them as instances, and track every task through to done."
      />

      <Card>
        <CardHeader>
          <CardTitle>My tasks</CardTitle>
          <CardDescription>Work assigned to you across every active workflow run.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <MyTasksPanel
            tasks={(myTasks ?? []).map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
              dueAt: t.due_at,
              instanceId: t.workflow_instance_id,
              instanceTitle: t.workflow_instances?.title ?? "Workflow run",
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active runs</CardTitle>
          <CardDescription>Every workflow currently in progress, and where it stands.</CardDescription>
        </CardHeader>
        {instances && instances.length > 0 ? (
          <ActiveInstancesTable
            instances={instances.map((i) => ({
              id: i.id,
              title: i.title,
              workflowName: i.workflow_definitions?.name ?? "Workflow",
              stageName: i.workflow_stages?.name ?? null,
              status: i.status,
              openTaskCount: i.workflow_tasks.filter((t) => t.status !== "done" && t.status !== "skipped").length,
            }))}
          />
        ) : (
          <CardContent>
            <p className="text-sm text-muted">No active runs yet — start one from a workflow below.</p>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workflows</CardTitle>
          <CardDescription>
            Model any business process as an ordered set of stages, then start runs against it.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <WorkflowDefinitionsPanel
            definitions={(definitions ?? []).map((d) => ({
              id: d.id,
              name: d.name,
              description: d.description,
              stageCount: d.workflow_stages.length,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Client onboarding</CardTitle>
          <CardDescription>Legacy view — each client&rsquo;s onboarding stage and contract status.</CardDescription>
        </CardHeader>
        {sortedClients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Onboarding stage</th>
                  <th className="px-5 py-3 font-medium">Latest contract</th>
                  <th className="px-5 py-3 font-medium">Contract status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedClients.map((client) => {
                  const contract = latestContractByClient.get(client.id);
                  return (
                    <tr key={client.id} className="hover:bg-surface-2/60">
                      <td className="px-5 py-3">
                        <Link
                          href={`/clients/${client.id}/onboarding`}
                          className="font-medium text-foreground hover:text-brand"
                        >
                          {client.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted">{STAGE_LABELS[client.onboarding_stage]}</td>
                      <td className="px-5 py-3 text-muted">
                        {contract ? contract.name : "No contract yet"}
                      </td>
                      <td className="px-5 py-3">
                        {contract ? (
                          <StatusBadge status={contract.status} />
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
        ) : (
          <CardContent>
            <EmptyState
              icon="🗂"
              title="No clients yet"
              description="Add a client to start tracking their onboarding workflow here."
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
}
