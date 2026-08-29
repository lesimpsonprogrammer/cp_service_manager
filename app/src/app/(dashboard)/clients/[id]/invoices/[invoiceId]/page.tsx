import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { InvoiceActions } from "@/components/invoices/InvoiceActions";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string; invoiceId: string }>;
}) {
  const { id, invoiceId } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", invoiceId).single();
  if (!invoice) notFound();

  const { data: client } = await supabase.from("clients").select("name").eq("id", id).single();
  const { data: lineItems } = await supabase
    .from("invoice_line_items")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("sort_order", { ascending: true });

  const items = lineItems ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{invoice.invoice_number}</CardTitle>
            <p className="mt-1 text-xs text-muted">
              Issued {invoice.issue_date}
              {invoice.due_date && ` · due ${invoice.due_date}`}
            </p>
          </div>
          <StatusBadge status={invoice.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Description</th>
                  <th className="px-4 py-2 font-medium">Qty</th>
                  <th className="px-4 py-2 font-medium">Rate</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-foreground">{item.description}</td>
                    <td className="px-4 py-2 text-muted">{item.quantity}</td>
                    <td className="px-4 py-2 text-muted">${Number(item.unit_price).toLocaleString()}</td>
                    <td className="px-4 py-2 text-foreground">${Number(item.amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span className="text-foreground">${Number(invoice.subtotal).toLocaleString()}</span>
            </div>
            {invoice.tax_rate > 0 && (
              <div className="flex justify-between">
                <span className="text-muted">Tax ({invoice.tax_rate}%)</span>
                <span className="text-foreground">${Number(invoice.tax_amount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-1 font-semibold">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">${Number(invoice.total).toLocaleString()}</span>
            </div>
          </div>

          {invoice.notes && (
            <div className="border-t border-border pt-3 text-sm">
              <p className="mb-1 text-xs uppercase tracking-wide text-muted">Notes</p>
              <p className="whitespace-pre-wrap text-foreground">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceActions clientId={id} invoice={invoice} clientName={client?.name ?? "the client"} />
        </CardContent>
      </Card>
    </div>
  );
}
