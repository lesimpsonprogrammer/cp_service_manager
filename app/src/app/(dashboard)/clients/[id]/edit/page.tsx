import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClientForm } from "@/components/clients/ClientForm";
import { createClient } from "@/lib/supabase/server";
import { updateClientRecord } from "../../actions";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();

  if (!client) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${client.name}`} description="Update this client's contact details and status." />
      <ClientForm
        action={updateClientRecord.bind(null, client.id)}
        client={client}
        submitLabel="Save changes"
        submitPendingLabel="Saving…"
      />
    </div>
  );
}
