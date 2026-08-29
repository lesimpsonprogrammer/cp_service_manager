import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ComplianceForm } from "@/components/clients/ComplianceForm";
import { updateClientCompliance } from "../../actions";

export default async function ClientCompliancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();

  if (!client) notFound();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance</CardTitle>
      </CardHeader>
      <CardContent>
        <ComplianceForm action={updateClientCompliance.bind(null, id)} client={client} />
      </CardContent>
    </Card>
  );
}
