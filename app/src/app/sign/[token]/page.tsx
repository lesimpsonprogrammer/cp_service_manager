import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SignatureForm } from "@/components/sign/SignatureForm";
import { renderAgreementBody } from "@/lib/contracts/template";

export default async function SignContractPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: contract } = await admin
    .from("client_contracts")
    .select(
      "id, name, status, start_date, end_date, value, notes, signer_name, signed_at, signed_by_name, client_id, org_id"
    )
    .eq("signing_token", token)
    .single();

  if (!contract) notFound();

  const { data: client } = await admin.from("clients").select("name").eq("id", contract.client_id).single();
  const { data: org } = await admin.from("organizations").select("name").eq("id", contract.org_id).single();

  if (contract.status === "signed" || contract.status === "active") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Already signed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-foreground">
            {contract.name} was signed by {contract.signed_by_name}
            {contract.signed_at && ` on ${new Date(contract.signed_at).toLocaleString()}`}.
          </p>
          <a href={`/sign/${token}/pdf`} target="_blank" className="text-brand hover:underline">
            View signed PDF ↗
          </a>
        </CardContent>
      </Card>
    );
  }

  if (contract.status !== "sent") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>This link isn&apos;t active</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted">
          This contract isn&apos;t currently out for signature. Contact {client?.name ?? "the sender"} if you
          believe this is a mistake.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{contract.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted">Prepared for {client?.name}.</p>
          {contract.start_date && <p>Start date: {contract.start_date}</p>}
          {contract.end_date && <p>End date: {contract.end_date}</p>}
          {contract.value != null && <p>Annual value: ${Number(contract.value).toLocaleString()}</p>}
          {contract.notes && (
            <p className="whitespace-pre-wrap text-foreground">
              {renderAgreementBody(contract.notes, {
                clientName: client?.name ?? "Client",
                orgName: org?.name ?? "Momentum Data Solutions",
                contractName: contract.name,
                startDate: contract.start_date,
                endDate: contract.end_date,
                value: contract.value,
              })}
            </p>
          )}
          <a href={`/sign/${token}/pdf`} target="_blank" className="inline-block text-brand hover:underline">
            View full contract PDF ↗
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sign this contract</CardTitle>
        </CardHeader>
        <CardContent>
          <SignatureForm token={token} prefillName={contract.signer_name ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
