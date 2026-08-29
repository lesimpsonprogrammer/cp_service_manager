import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { DeleteClientButton } from "@/components/clients/DeleteClientButton";
import { ClientStatusActions } from "@/components/clients/ClientStatusActions";
import { OnboardingStageActions } from "@/components/clients/OnboardingStageActions";
import { NewContractForm } from "@/components/clients/NewContractForm";
import { ContractsList } from "@/components/clients/ContractsList";
import { getConnectorDefinition } from "@/lib/connectors/registry";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();

  if (!client) notFound();

  const { data: dataSources } = await supabase
    .from("data_sources")
    .select("id, name, type, status")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  const { data: contracts } = await supabase
    .from("client_contracts")
    .select("id, name, status, start_date, end_date, value")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title={client.name}
        description="Client profile, contacts, and connected data sources."
        action={
          <div className="flex items-center gap-2">
            <Link href={`/clients/${client.id}/edit`}>
              <Button variant="secondary" size="sm">
                Edit
              </Button>
            </Link>
            <DeleteClientButton clientId={client.id} />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Primary contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2 text-sm">
              <span className="text-muted">Name</span>
              <span className="text-foreground">{client.primary_contact_name ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border/60 pb-2 text-sm">
              <span className="text-muted">Email</span>
              <span className="text-foreground">{client.primary_contact_email ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Phone</span>
              <span className="text-foreground">{client.primary_contact_phone ?? "—"}</span>
            </div>
            {client.notes && (
              <div className="border-t border-border pt-3 text-sm">
                <p className="mb-1 text-xs uppercase tracking-wide text-muted">Notes</p>
                <p className="whitespace-pre-wrap text-foreground">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusBadge status={client.status} />
            <ClientStatusActions clientId={client.id} status={client.status} />
            <p className="text-xs text-muted">
              Added {new Date(client.created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Onboarding</CardTitle>
        </CardHeader>
        <CardContent>
          <OnboardingStageActions clientId={client.id} stage={client.onboarding_stage} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Contracts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ContractsList clientId={client.id} contracts={contracts ?? []} />
          <NewContractForm clientId={client.id} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Data sources for this client</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {dataSources && dataSources.length > 0 ? (
            <ul className="divide-y divide-border">
              {dataSources.map((source) => (
                <li key={source.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <Link href={`/data-sources/${source.id}`} className="font-medium text-foreground hover:text-brand">
                    {source.name}
                    <span className="ml-2 text-xs text-muted">
                      {getConnectorDefinition(source.type)?.label ?? source.type}
                    </span>
                  </Link>
                  <StatusBadge status={source.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-muted">
              No data sources are linked to this client yet.{" "}
              <Link href="/data-sources/new" className="text-brand hover:underline">
                Connect one
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
