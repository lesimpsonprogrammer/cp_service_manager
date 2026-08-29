import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ContractsList } from "@/components/clients/ContractsList";
import { ContractForm } from "@/components/clients/ContractForm";
import { createContract } from "../../actions";

export default async function ClientContractsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: contracts } = await supabase
    .from("client_contracts")
    .select("id, name, status, start_date, end_date, value")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  const { data: templates } = await supabase
    .from("agreement_templates")
    .select("id, name, body")
    .order("name", { ascending: true });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Contracts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ContractsList clientId={id} contracts={contracts ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add a contract</CardTitle>
        </CardHeader>
        <CardContent>
          <ContractForm action={createContract.bind(null, id)} templates={templates ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
