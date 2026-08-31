import { createAdminClient } from "@/lib/supabase/admin";
import { generateInvoiceFromTimecard } from "@/lib/invoices/generateFromTimecard";

/**
 * Finds client-approved timecards across all orgs that don't have an
 * invoice yet and drafts one for each (mirrors the manual "Generate from an
 * approved timecard" action, src/app/(dashboard)/invoices/actions.ts).
 * Invoices are created as drafts only — nothing is emailed to a client
 * here, someone still reviews and sends. Called by the weekly cron route;
 * uses the admin client since it runs with no signed-in user.
 */
export async function autoInvoiceApprovedTimecards(): Promise<{ invoicesCreated: number }> {
  const admin = createAdminClient();

  const { data: timecards } = await admin
    .from("timecards")
    .select("id, org_id, client_id")
    .eq("status", "client_approved");

  if (!timecards || timecards.length === 0) return { invoicesCreated: 0 };

  const { data: invoicedTimecards } = await admin.from("invoices").select("timecard_id").not("timecard_id", "is", null);
  const invoicedTimecardIds = new Set((invoicedTimecards ?? []).map((i) => i.timecard_id));

  let invoicesCreated = 0;

  for (const timecard of timecards) {
    if (invoicedTimecardIds.has(timecard.id)) continue;

    const { invoiceId } = await generateInvoiceFromTimecard(admin, timecard.org_id, timecard.client_id, timecard.id, null);
    if (invoiceId) invoicesCreated += 1;
  }

  return { invoicesCreated };
}
