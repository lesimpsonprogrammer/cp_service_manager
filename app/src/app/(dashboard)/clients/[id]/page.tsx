import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { getOrgMembers } from "@/lib/org/getOrgMembers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { ClientStatusActions } from "@/components/clients/ClientStatusActions";
import { ClientPermissionsPanel } from "@/components/clients/ClientPermissionsPanel";

const ADMIN_ROLES = new Set(["owner", "admin"]);

export default async function ClientOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();

  if (!client) notFound();

  const { data: projectManager } = client.project_manager_id
    ? await supabase.from("profiles").select("full_name").eq("id", client.project_manager_id).maybeSingle()
    : { data: null };

  const { data: projectConsultant } = client.project_consultant_id
    ? await supabase.from("profiles").select("full_name").eq("id", client.project_consultant_id).maybeSingle()
    : { data: null };

  const org = await getCurrentOrg();
  const isAdmin = !!org && ADMIN_ROLES.has(org.role);

  const orgMembers = isAdmin ? await getOrgMembers(org!.orgId) : [];

  const { data: clientPermissionGrants } = isAdmin
    ? await supabase
        .from("permission_grants")
        .select("user_id, permission")
        .eq("org_id", org!.orgId)
        .eq("client_id", id)
    : { data: [] };

  const trustedUserIds = new Set(
    [client.project_manager_id, client.project_consultant_id].filter((v): v is string => !!v)
  );

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
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Project Consultant</span>
            <span className="text-foreground">{projectConsultant?.full_name || "Unassigned"}</span>
          </div>
          <p className="text-xs text-muted">Added {new Date(client.created_at).toLocaleDateString()}</p>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Client permissions</CardTitle>
            <CardDescription>
              Client Accounting and Contract Management access for this client, on top of whatever role each
              teammate already has.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ClientPermissionsPanel
              clientId={client.id}
              members={orgMembers}
              grants={clientPermissionGrants ?? []}
              trustedUserIds={trustedUserIds}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
