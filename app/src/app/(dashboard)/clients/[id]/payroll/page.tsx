import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PayrollEnrollForm } from "@/components/clients/PayrollEnrollForm";
import { PayRunForm } from "@/components/clients/PayRunForm";
import { enrollClientInPayroll, submitPayRun } from "./actions";

export default async function ClientPayrollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase.from("clients").select("id, name").eq("id", id).single();
  if (!client) notFound();

  const { data: payrollCompany } = await supabase
    .from("payroll_companies")
    .select("*")
    .eq("client_id", id)
    .maybeSingle();

  if (!payrollCompany) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enroll in payroll</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted">
            Payroll runs through a licensed provider (Check) — tax withholding, filings, and direct deposit are
            handled on their side. Enrolling here creates the company record and kicks off their onboarding flow.
          </p>
          <PayrollEnrollForm action={enrollClientInPayroll.bind(null, id)} />
        </CardContent>
      </Card>
    );
  }

  const { data: payRuns } = await supabase
    .from("pay_runs")
    .select("id, pay_period_start, pay_period_end, pay_date, status, gross_pay_cents, net_pay_cents")
    .eq("payroll_company_id", payrollCompany.id)
    .order("pay_date", { ascending: false });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Payroll status <Badge tone={payrollCompany.status === "active" ? "success" : "warning"}>{payrollCompany.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">
            Provider: {payrollCompany.provider} · Provider company ID: {payrollCompany.provider_company_id ?? "—"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submit a pay run</CardTitle>
        </CardHeader>
        <CardContent>
          <PayRunForm
            action={submitPayRun.bind(null, payrollCompany.id, payrollCompany.provider_company_id ?? "", payrollCompany.provider)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pay run history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {payRuns && payRuns.length > 0 ? (
            <ul className="divide-y divide-border">
              {payRuns.map((run) => (
                <li key={run.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span>
                    {run.pay_period_start} – {run.pay_period_end} (paid {run.pay_date})
                  </span>
                  <Badge tone={run.status === "paid" ? "success" : run.status === "failed" ? "danger" : "neutral"}>
                    {run.status}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-sm text-muted">No pay runs yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
