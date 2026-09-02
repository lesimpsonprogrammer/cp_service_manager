import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConnectionCard } from "@/components/accounting/ConnectionCard";
import { ACCOUNTING_CONNECTION_TYPES, getAccountingConnectionFields } from "@/lib/accounting/registry";
import type { AccountingConnectionStatus, AccountingConnectionType } from "@/types/database";

export default async function GlobalAccountingPage() {
  const org = await getCurrentOrg();
  if (!org) return null;

  const supabase = await createClient();
  const canManage = org.role === "owner" || org.role === "admin";

  const [{ data: connections }, { data: clients }, { data: invoices }] = await Promise.all([
    supabase.from("accounting_connections").select("*").eq("org_id", org.orgId),
    supabase.from("clients").select("id, name, status, payment_terms").order("name"),
    supabase.from("invoices").select("client_id, status, total"),
  ]);

  const connectionByType = new Map(
    (connections ?? []).map((c) => [c.connection_type as AccountingConnectionType, c])
  );

  const fields = getAccountingConnectionFields();

  const invoiceList = invoices ?? [];
  const totalsByClient = new Map<string, { outstanding: number; paid: number }>();
  for (const invoice of invoiceList) {
    const entry = totalsByClient.get(invoice.client_id) ?? { outstanding: 0, paid: 0 };
    if (invoice.status === "sent" || invoice.status === "overdue") entry.outstanding += Number(invoice.total);
    if (invoice.status === "paid") entry.paid += Number(invoice.total);
    totalsByClient.set(invoice.client_id, entry);
  }

  const totalOutstanding = invoiceList
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + Number(i.total), 0);
  const totalPaid = invoiceList.filter((i) => i.status === "paid").reduce((sum, i) => sum + Number(i.total), 0);
  const connectedCount = ACCOUNTING_CONNECTION_TYPES.filter(
    (def) => (connectionByType.get(def.type)?.status ?? "not_connected") === "connected"
  ).length;

  return (
    <div>
      <PageHeader
        title="Global Accounting"
        description="The org-level books of record. Every client's Accounting and Invoices tabs are a sub-account of this hub."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Connections" value={`${connectedCount} / ${ACCOUNTING_CONNECTION_TYPES.length}`} hint="connected" />
        <StatCard
          label="Outstanding"
          value={`$${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          hint="across every client sub-account"
        />
        <StatCard
          label="Paid"
          value={`$${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          hint="across every client sub-account"
        />
      </div>

      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Connections — set up to match your accounting software (QuickBooks)
      </h3>
      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        {ACCOUNTING_CONNECTION_TYPES.map((definition) => {
          const connection = connectionByType.get(definition.type);
          const config = (connection?.config as Record<string, unknown>) ?? {};
          const nonSecretConfig: Record<string, string> = {};
          const hasSecret: Record<string, boolean> = {};
          for (const field of fields) {
            const value = config[field.key];
            if (field.secret) hasSecret[field.key] = value != null && value !== "";
            else if (value != null) nonSecretConfig[field.key] = String(value);
          }

          return (
            <ConnectionCard
              key={definition.type}
              definition={definition}
              fields={fields}
              config={nonSecretConfig}
              hasSecret={hasSecret}
              status={(connection?.status as AccountingConnectionStatus) ?? "not_connected"}
              companyName={connection?.company_name ?? null}
              canManage={canManage}
            />
          );
        })}
      </div>

      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Client sub-accounts</h3>
      {clients && clients.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Payment terms</th>
                  <th className="px-5 py-3 font-medium">Outstanding</th>
                  <th className="px-5 py-3 font-medium">Paid</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((client) => {
                  const totals = totalsByClient.get(client.id) ?? { outstanding: 0, paid: 0 };
                  return (
                    <tr key={client.id} className="hover:bg-surface-2/60">
                      <td className="px-5 py-3 font-medium text-foreground">{client.name}</td>
                      <td className="px-5 py-3 text-muted">{client.payment_terms ?? "—"}</td>
                      <td className="px-5 py-3 text-foreground">
                        ${totals.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-foreground">
                        ${totals.paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/clients/${client.id}/accounting`} className="text-brand hover:underline">
                          Open sub-account →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon="🏦"
          title="No client sub-accounts yet"
          description="Add a client to see its Accounting and Invoices roll up here."
        />
      )}
    </div>
  );
}
