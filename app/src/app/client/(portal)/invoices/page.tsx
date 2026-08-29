import { createClient } from "@/lib/supabase/server";
import { getCurrentClientPortalUser } from "@/lib/portal/getCurrentClientPortalUser";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function ClientInvoicesPage() {
  const clientUser = await getCurrentClientPortalUser();
  if (!clientUser) return null;

  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, issue_date, due_date, total")
    .eq("client_id", clientUser.clientId)
    .order("issue_date", { ascending: false });

  return (
    <div>
      <PageHeader title="Invoices" description="Every invoice we've issued you, and where it stands." />

      {(invoices ?? []).length === 0 ? (
        <EmptyState title="No invoices yet" />
      ) : (
        <Card className="p-0">
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {(invoices ?? []).map((invoice) => (
                <li key={invoice.id} className="flex items-center justify-between px-5 py-4 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{invoice.invoice_number}</p>
                    <p className="mt-1 text-xs text-muted">
                      Issued {new Date(invoice.issue_date).toLocaleDateString()}
                      {invoice.due_date ? ` · due ${new Date(invoice.due_date).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted">${Number(invoice.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <StatusBadge status={invoice.status} />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
