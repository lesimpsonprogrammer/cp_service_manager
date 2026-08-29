import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { ClientStatusActions } from "@/components/clients/ClientStatusActions";

export default async function ClientOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();

  if (!client) notFound();

  const { data: projectManager } = client.project_manager_id
    ? await supabase.from("profiles").select("full_name").eq("id", client.project_manager_id).maybeSingle()
    : { data: null };

  return (
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
          <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted">Project Manager</span>
            <span className="text-foreground">{projectManager?.full_name || "Unassigned"}</span>
          </div>
          <p className="text-xs text-muted">Added {new Date(client.created_at).toLocaleDateString()}</p>
        </CardContent>
      </Card>
    </div>
  );
}
