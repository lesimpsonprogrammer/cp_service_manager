import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";

export default async function InvoicesPage() {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, issue_date, due_date, total, client_id")
    .order("issue_date", { ascending: false })
    .limit(200);

  const { data: clients } = await supabase.from("clients").select("id, name");
  const clientNames = new Map((clients ?? []).map((c) => [c.id, c.name]));

  const invoiceList = invoices ?? [];
  const outstanding = invoiceList
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + Number(i.total), 0);
  const paid = invoiceList.filter((i) => i.status === "paid").reduce((sum, i) => sum + Number(i.total), 0);

  return (
    <div>
      <PageHeader title="Invoices" description="Every invoice issued across all clients, most recent first." />

      {invoiceList.length > 0 ? (
        <>
          <Card className="mb-4 p-4 text-sm text-muted">
            ${outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })} outstanding · $
            {paid.toLocaleString(undefined, { minimumFractionDigits: 2 })} paid
          </Card>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Number</th>
                    <th className="px-5 py-3 font-medium">Client</th>
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
                          href={`/clients/${invoice.client_id}/invoices/${invoice.id}`}
                          className="font-medium text-foreground hover:text-brand"
                        >
                          {invoice.invoice_number}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/clients/${invoice.client_id}/invoices`}
                          className="text-foreground hover:text-brand"
                        >
                          {clientNames.get(invoice.client_id) ?? "—"}
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
          </Card>
        </>
      ) : (
        <EmptyState
          icon="🧾"
          title="No invoices yet"
          description="Create one from any client's Invoices tab — it'll show up here across your whole workspace."
        />
      )}
    </div>
  );
}
