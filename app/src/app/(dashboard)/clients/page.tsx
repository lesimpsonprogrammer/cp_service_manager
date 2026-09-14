import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";

type ClientListRow = {
  id: string;
  client_number: string;
  name: string;
  status: "active" | "prospect" | "inactive";
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  created_at: string;
};

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, client_number, name, status, primary_contact_name, primary_contact_email, created_at")
    .order("created_at", { ascending: false });

  const clients = (data ?? []) as unknown as ClientListRow[];

  return (
    <div>
      <PageHeader
        title="Clients"
        description="The companies you run data extraction, HR consulting, or managed payroll work for."
        action={
          <Link href="/clients/new">
            <Button>+ Add client</Button>
          </Link>
        }
      />

      {clients.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Client ID</th>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Primary contact</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-surface-2/60">
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-semibold text-brand">
                      {client.client_number}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/clients/${client.id}`} className="font-medium text-foreground hover:text-brand">
                        {client.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {client.primary_contact_name ?? client.primary_contact_email ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={client.status} />
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {new Date(client.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon="🏢"
          title="No clients yet"
          description="Add the companies you extract data for or run payroll operations on behalf of."
          action={
            <Link href="/clients/new">
              <Button>Add your first client</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
