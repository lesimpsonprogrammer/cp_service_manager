import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateContractPdf } from "@/lib/contracts/pdf";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: contract } = await admin.from("client_contracts").select("*").eq("signing_token", token).single();
  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: client } = await admin
    .from("clients")
    .select("name, compliance_frameworks, hipaa_covered_entity, compliance_notes, payment_terms, payment_method")
    .eq("id", contract.client_id)
    .single();
  const { data: org } = await admin.from("organizations").select("name").eq("id", contract.org_id).single();

  const pdfBytes = await generateContractPdf({
    contract,
    client: client ?? {
      name: "Client",
      compliance_frameworks: [],
      hipaa_covered_entity: false,
      compliance_notes: null,
      payment_terms: null,
      payment_method: null,
    },
    orgName: org?.name ?? "Momentum Data Solutions",
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=\"contract.pdf\"",
    },
  });
}
