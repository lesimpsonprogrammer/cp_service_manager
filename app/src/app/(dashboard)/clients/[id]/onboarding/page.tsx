import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { OnboardingProgress } from "@/components/clients/OnboardingProgress";
import { ContractSigningPanel } from "@/components/clients/ContractSigningPanel";
import { OnboardingActionsMenu } from "@/components/clients/OnboardingActionsMenu";
import { ContractForm } from "@/components/clients/ContractForm";
import { createContract } from "../../actions";

export default async function ClientOnboardingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, onboarding_stage, primary_contact_name, primary_contact_email")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const { data: contract } = await supabase
    .from("client_contracts")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: templates } = await supabase
    .from("agreement_templates")
    .select("id, name, body")
    .order("name", { ascending: true });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Onboarding status</CardTitle>
        </CardHeader>
        <CardContent>
          <OnboardingProgress stage={client.onboarding_stage} />
        </CardContent>
      </Card>

      {contract ? (
        <>
          <ContractSigningPanel
            clientId={id}
            contract={contract}
            defaultSignerName={client.primary_contact_name}
            defaultSignerEmail={client.primary_contact_email}
          />
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <OnboardingActionsMenu clientId={id} contract={contract} />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Start onboarding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted">
              Add this client&apos;s contract here to kick off approval and e-signature — no need to leave this
              tab. (Additional contracts, once this one exists, can be managed from the Contracts tab.)
            </p>
            <ContractForm action={createContract.bind(null, id)} templates={templates ?? []} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
