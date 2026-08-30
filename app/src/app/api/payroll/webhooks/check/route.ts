import { createAdminClient } from "@/lib/supabase/admin";

/**
 * SCAFFOLD — receives Check webhook events (pay run status changes, tax
 * filing confirmations, company/employee onboarding completion).
 *
 * Signature verification is stubbed out: Check signs webhook payloads, but
 * the exact header name and algorithm need to be confirmed against their
 * current docs once partner-approved (do not enable this route in
 * production before that's filled in — right now it would accept
 * unauthenticated POSTs).
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  // TODO: verify request signature against process.env.CHECK_WEBHOOK_SECRET
  // before trusting the payload, per Check's webhook signing docs.

  let payload: { type?: string; data?: { company?: string; id?: string; status?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const admin = createAdminClient();
  const providerCompanyId = payload.data?.company ?? null;

  const { data: payrollCompany } = providerCompanyId
    ? await admin.from("payroll_companies").select("id").eq("provider_company_id", providerCompanyId).maybeSingle()
    : { data: null };

  await admin.from("payroll_provider_events").insert({
    payroll_company_id: payrollCompany?.id ?? null,
    provider: "check",
    event_type: payload.type ?? "unknown",
    payload,
  });

  if (payrollCompany && payload.type === "payroll.status_updated" && payload.data?.status) {
    await admin
      .from("pay_runs")
      .update({ status: payload.data.status as "processing" | "submitted" | "paid" | "failed" })
      .eq("provider_pay_run_id", payload.data.id ?? "");
  }

  return Response.json({ ok: true });
}
