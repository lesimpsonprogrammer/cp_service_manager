import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { OnboardingProgress } from "@/components/clients/OnboardingProgress";
import { ContractSigningPanel } from "@/components/clients/ContractSigningPanel";
import { OnboardingActionsMenu } from "@/components/clients/OnboardingActionsMenu";

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
        <EmptyState
          icon="📄"
          title="No contract yet"
          description="Add a contract to start the approval and e-signature workflow."
          action={
            <Link href={`/clients/${id}/contracts`}>
              <Button>Go to contracts</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
