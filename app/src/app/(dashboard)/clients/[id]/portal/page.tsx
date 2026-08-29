import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ClientPortalAccessPanel } from "@/components/clients/ClientPortalAccessPanel";

export default async function ClientPortalAccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: users }, { data: invites }] = await Promise.all([
    supabase
      .from("client_portal_users")
      .select("id, email, created_at")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("client_portal_invites")
      .select("id, email, expires_at, accepted_at")
      .eq("client_id", id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client portal access</CardTitle>
      </CardHeader>
      <CardContent>
        <ClientPortalAccessPanel clientId={id} users={users ?? []} pendingInvites={invites ?? []} />
      </CardContent>
    </Card>
  );
}
