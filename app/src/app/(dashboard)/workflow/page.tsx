import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
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
  const supabase = await createClient();

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
    <div>
      <PageHeader
        title="Workflow"
        description="Every client's onboarding stage and contract status, in one place — no need to open each client to check."
      />

      {sortedClients.length > 0 ? (
        <Card className="overflow-hidden">
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
        </Card>
      ) : (
        <EmptyState
          icon="🗂"
          title="No clients yet"
          description="Add a client to start tracking their onboarding workflow here."
        />
      )}
    </div>
  );
}
