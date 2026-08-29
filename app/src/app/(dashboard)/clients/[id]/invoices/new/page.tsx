import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";

export default async function NewInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, billing_contact_name, billing_contact_email")
    .eq("id", id)
    .single();
  if (!client) notFound();

  const { data: contracts } = await supabase
    .from("client_contracts")
    .select("id, name")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  return (
    <Card>
      <CardHeader>
        <CardTitle>New invoice</CardTitle>
      </CardHeader>
      <CardContent>
        <InvoiceForm
          clientId={id}
          contracts={contracts ?? []}
          defaultBillingContactName={client.billing_contact_name}
          defaultBillingContactEmail={client.billing_contact_email}
        />
      </CardContent>
    </Card>
  );
}
