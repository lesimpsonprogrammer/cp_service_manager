import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { GenerateInvoiceFromTimecard } from "@/components/invoices/GenerateInvoiceFromTimecard";

export default async function ClientInvoicesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase.from("clients").select("id, name").eq("id", id).single();
  if (!client) notFound();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, issue_date, due_date, total")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  const { data: timecards } = await supabase
    .from("timecards")
    .select("id, period_start, period_end, total_hours, total_amount")
    .eq("client_id", id)
    .eq("status", "client_approved")
    .order("period_start", { ascending: false });

  const { data: invoicedTimecards } = await supabase.from("invoices").select("timecard_id").eq("client_id", id);
  const invoicedTimecardIds = new Set((invoicedTimecards ?? []).map((i) => i.timecard_id).filter(Boolean));
  const uninvoicedTimecards = (timecards ?? []).filter((t) => !invoicedTimecardIds.has(t.id));

  const invoiceList = invoices ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invoices</CardTitle>
          <Link href={`/clients/${id}/invoices/new`}>
            <Button size="sm">New invoice</Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {invoiceList.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon="🧾"
                title="No invoices yet"
                description="Create one manually or generate it from an approved timecard below."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Number</th>
                    <th className="px-5 py-3 font-medium">Issued</th>
                    <th className="px-5 py-3 font-medium">Due</th>
                    <th className="px-5 py-3 font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoiceList.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-surface-2/60">
                      <td className="px-5 py-3">
                        <Link
                          href={`/clients/${id}/invoices/${invoice.id}`}
                          className="font-medium text-foreground hover:text-brand"
                        >
                          {invoice.invoice_number}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted">{invoice.issue_date}</td>
                      <td className="px-5 py-3 text-muted">{invoice.due_date ?? "—"}</td>
                      <td className="px-5 py-3 text-foreground">
                        ${Number(invoice.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={invoice.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {uninvoicedTimecards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generate from an approved timecard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {uninvoicedTimecards.map((timecard) => (
              <GenerateInvoiceFromTimecard key={timecard.id} clientId={id} timecard={timecard} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
