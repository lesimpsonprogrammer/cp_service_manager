"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { getPayrollProviderClient } from "@/lib/payroll";

export interface PayrollFormState {
  error: string | null;
}

/**
 * Enrolls a client with the payroll provider (Check, by default) and
 * records the resulting provider-side company id. This does not itself
 * onboard any employees or run payroll — the provider hands back an
 * onboarding URL (bank verification, tax setup, etc.) the client completes
 * before the company can go `active`.
 */
export async function enrollClientInPayroll(
  clientId: string,
  _prev: PayrollFormState,
  formData: FormData
): Promise<PayrollFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };
  if (org.role !== "owner" && org.role !== "admin") return { error: "Only org admins can enroll payroll." };

  const legalName = String(formData.get("legal_name") ?? "").trim();
  const ein = String(formData.get("ein") ?? "").trim();
  if (!legalName) return { error: "Legal company name is required." };
  if (!ein) return { error: "EIN is required." };

  const supabase = await createClient();
  const provider = "check";

  let providerCompanyId: string;
  try {
    const client = getPayrollProviderClient(provider);
    const result = await client.createCompany({ legalName, ein });
    providerCompanyId = result.providerCompanyId;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to enroll with the payroll provider." };
  }

  const { error } = await supabase.from("payroll_companies").upsert(
    {
      org_id: org.orgId,
      client_id: clientId,
      provider,
      provider_company_id: providerCompanyId,
      ein,
      status: "onboarding",
    },
    { onConflict: "client_id" }
  );

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}/payroll`);
  return { error: null };
}

export async function submitPayRun(
  payrollCompanyId: string,
  providerCompanyId: string,
  provider: string,
  _prev: PayrollFormState,
  formData: FormData
): Promise<PayrollFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };
  if (org.role !== "owner" && org.role !== "admin") return { error: "Only org admins can submit pay runs." };

  const payPeriodStart = String(formData.get("pay_period_start") ?? "");
  const payPeriodEnd = String(formData.get("pay_period_end") ?? "");
  const payDate = String(formData.get("pay_date") ?? "");
  if (!payPeriodStart || !payPeriodEnd || !payDate) {
    return { error: "Pay period start, end, and pay date are all required." };
  }

  const supabase = await createClient();

  let providerPayRunId: string;
  let status: string;
  try {
    const client = getPayrollProviderClient(provider);
    const result = await client.submitPayRun({
      providerCompanyId,
      payPeriodStart,
      payPeriodEnd,
      payDate,
    });
    providerPayRunId = result.providerPayRunId;
    status = result.status;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to submit pay run to the payroll provider." };
  }

  const { error } = await supabase.from("pay_runs").insert({
    payroll_company_id: payrollCompanyId,
    provider_pay_run_id: providerPayRunId,
    pay_period_start: payPeriodStart,
    pay_period_end: payPeriodEnd,
    pay_date: payDate,
    status: (status as "draft" | "processing" | "submitted") ?? "processing",
    created_by: org.userId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/clients/${payrollCompanyId}/payroll`);
  return { error: null };
}
