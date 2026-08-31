import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `INV-${year}-${suffix}`;
}

/**
 * Core of "generate invoice from timecard", shared by the manual dashboard
 * action (src/app/(dashboard)/invoices/actions.ts) and the auto-invoice cron
 * (src/lib/invoices/autoInvoiceTimecards.ts). Takes a plain client/admin
 * Supabase client so callers can pass either a request-scoped client (manual
 * action, has an org context) or the service-role admin client (cron, has
 * none). Does not redirect or revalidate paths — callers own that.
 */
export async function generateInvoiceFromTimecard(
  supabase: SupabaseClient<Database>,
  orgId: string,
  clientId: string,
  timecardId: string,
  createdBy: string | null
): Promise<{ invoiceId: string | null; error: string | null }> {
  const { data: timecard } = await supabase
    .from("timecards")
    .select("id, period_start, period_end, total_hours, total_amount")
    .eq("id", timecardId)
    .single();

  if (!timecard) return { invoiceId: null, error: "Timecard not found." };

  const { data: client } = await supabase
    .from("clients")
    .select("billing_contact_name, billing_contact_email")
    .eq("id", clientId)
    .single();

  const { data: entries } = await supabase
    .from("time_entries")
    .select("contract_id")
    .eq("timecard_id", timecardId)
    .limit(1);

  const contractId = entries?.[0]?.contract_id ?? null;
  const { data: contract } = contractId
    ? await supabase.from("client_contracts").select("hourly_rate").eq("id", contractId).single()
    : { data: null as { hourly_rate: number | null } | null };

  const rate = contract?.hourly_rate ?? (timecard.total_hours > 0 ? (timecard.total_amount ?? 0) / timecard.total_hours : 0);
  const amount = timecard.total_amount ?? timecard.total_hours * rate;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      org_id: orgId,
      client_id: clientId,
      contract_id: contractId,
      timecard_id: timecardId,
      invoice_number: generateInvoiceNumber(),
      subtotal: amount,
      tax_amount: 0,
      total: amount,
      billing_contact_name: client?.billing_contact_name ?? null,
      billing_contact_email: client?.billing_contact_email ?? null,
      created_by: createdBy,
    })
    .select("id")
    .single();

  if (error || !invoice) return { invoiceId: null, error: error?.message ?? "Failed to create invoice." };

  const { error: itemsError } = await supabase.from("invoice_line_items").insert({
    invoice_id: invoice.id,
    org_id: orgId,
    description: `Professional services: ${timecard.period_start} – ${timecard.period_end} (${timecard.total_hours}h)`,
    quantity: timecard.total_hours,
    unit_price: rate,
    amount,
    sort_order: 0,
  });

  if (itemsError) return { invoiceId: invoice.id, error: itemsError.message };

  return { invoiceId: invoice.id, error: null };
}
