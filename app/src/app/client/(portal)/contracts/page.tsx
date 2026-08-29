import { createClient } from "@/lib/supabase/server";
import { getCurrentClientPortalUser } from "@/lib/portal/getCurrentClientPortalUser";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function ClientContractsPage() {
  const clientUser = await getCurrentClientPortalUser();
  if (!clientUser) return null;

  const supabase = await createClient();
  const { data: contracts } = await supabase
    .from("client_contracts")
    .select("id, contract_number, name, status, start_date, end_date, value")
    .eq("client_id", clientUser.clientId)
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Contracts" description="Agreements between us, and where each one stands." />

      {(contracts ?? []).length === 0 ? (
        <EmptyState title="No contracts yet" />
      ) : (
        <Card className="p-0">
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {(contracts ?? []).map((contract) => (
                <li key={contract.id} className="flex items-center justify-between px-5 py-4 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{contract.name}</p>
                    <p className="mt-1 font-mono text-xs text-muted">{contract.contract_number}</p>
                    {(contract.start_date || contract.end_date) && (
                      <p className="mt-1 text-xs text-muted">
                        {contract.start_date ?? "—"} – {contract.end_date ?? "—"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {contract.value != null && (
                      <span className="text-muted">${Number(contract.value).toLocaleString()}</span>
                    )}
                    <StatusBadge status={contract.status} />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
