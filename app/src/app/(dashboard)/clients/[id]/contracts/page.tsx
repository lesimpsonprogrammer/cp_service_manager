import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ContractsList, type ContractRow } from "@/components/clients/ContractsList";
import { ContractForm } from "@/components/clients/ContractForm";
import { createContract } from "../../actions";

export default async function ClientContractsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: contractsData }, { data: client }, { data: templates }] = await Promise.all([
    supabase
      .from("client_contracts")
      .select("id, agreement_number, contract_number, name, status, start_date, end_date, value")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("client_number").eq("id", id).single(),
    supabase
      .from("agreement_templates")
      .select("id, name, body")
      .order("name", { ascending: true }),
  ]);

  const contracts = (contractsData ?? []) as unknown as ContractRow[];
  const clientNumber = (client as unknown as { client_number?: string } | null)?.client_number ?? null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Agreements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ContractsList clientId={id} clientNumber={clientNumber} contracts={contracts} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add an agreement</CardTitle>
        </CardHeader>
        <CardContent>
          <ContractForm action={createContract.bind(null, id)} templates={templates ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
