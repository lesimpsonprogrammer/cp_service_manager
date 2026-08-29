import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AccountingForm } from "@/components/clients/AccountingForm";
import { updateClientBilling } from "../../actions";

export default async function ClientAccountingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();

  if (!client) notFound();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & payment</CardTitle>
      </CardHeader>
      <CardContent>
        <AccountingForm action={updateClientBilling.bind(null, id)} client={client} />
      </CardContent>
    </Card>
  );
}
