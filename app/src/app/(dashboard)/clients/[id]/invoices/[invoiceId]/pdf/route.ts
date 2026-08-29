import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateInvoicePdf } from "@/lib/invoices/pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; invoiceId: string }> }
) {
  const { invoiceId } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", invoiceId).single();
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: lineItems } = await supabase
    .from("invoice_line_items")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("sort_order", { ascending: true });

  const { data: client } = await supabase
    .from("clients")
    .select("name, payment_terms, payment_method")
    .eq("id", invoice.client_id)
    .single();
  const { data: org } = await supabase.from("organizations").select("name").eq("id", invoice.org_id).single();

  const pdfBytes = await generateInvoicePdf({
    invoice,
    lineItems: lineItems ?? [],
    client: client ?? { name: "Client", payment_terms: null, payment_method: null },
    orgName: org?.name ?? "Momentum Data Solutions",
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoice_number}.pdf"`,
    },
  });
}
