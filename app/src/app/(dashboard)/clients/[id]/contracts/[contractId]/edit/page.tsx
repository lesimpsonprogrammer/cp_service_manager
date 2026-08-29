import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContractForm } from "@/components/clients/ContractForm";
import { updateContract } from "../../../../actions";

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ id: string; contractId: string }>;
}) {
  const { id, contractId } = await params;
  const supabase = await createClient();
  const { data: contract } = await supabase.from("client_contracts").select("*").eq("id", contractId).single();

  if (!contract) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${contract.name}`} />
      <ContractForm
        action={updateContract.bind(null, id, contractId)}
        contract={contract}
        submitLabel="Save changes"
        submitPendingLabel="Saving…"
      />
    </div>
  );
}
