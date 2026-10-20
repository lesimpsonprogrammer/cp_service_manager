import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { getOrgMembers } from "@/lib/org/getOrgMembers";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TicketQueue } from "@/components/service-desk/TicketQueue";
import { buildQueueRows } from "@/components/service-desk/buildQueueRows";
import { ACTIVE_STATUSES } from "@/lib/service-desk/constants";
import { fetchQueue, parseQueueFilters } from "@/lib/service-desk/queue";

export default async function ClientTicketsPage({ params }: { params: Promise<{ id: string }> }) {
  const org = await getCurrentOrg();
  if (!org) redirect("/login");
  const { id } = await params;

  const supabase = await createClient();
  const filters = { ...parseQueueFilters({}), queue: "all" as const, clientId: id };
  const [rows, members, { data: categories }, { data: client }] = await Promise.all([
    fetchQueue(supabase, org.orgId, org.userId, filters),
    getOrgMembers(org.orgId),
    supabase.from("ticket_categories").select("id, name").eq("org_id", org.orgId),
    supabase.from("clients").select("id, name").eq("id", id).maybeSingle(),
  ]);

  const tableRows = buildQueueRows(rows, {
    clientNames: new Map(client ? [[client.id, client.name]] : []),
    memberNames: new Map(members.map((m) => [m.userId, m.fullName])),
    categoryNames: new Map((categories ?? []).map((c) => [c.id, c.name])),
  });
  const openCount = rows.filter((r) => ACTIVE_STATUSES.includes(r.status)).length;
  const canEdit = org.role !== "viewer";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {rows.length} ticket{rows.length === 1 ? "" : "s"} · {openCount} open. Clients with portal access can file and follow these under Support.
        </p>
        {canEdit && (
          <Link href={`/tickets/new?client=${id}`}>
            <Button size="sm">New ticket</Button>
          </Link>
        )}
      </div>
      {tableRows.length ? (
        <TicketQueue rows={tableRows} members={members} canEdit={canEdit} />
      ) : (
        <EmptyState icon="🎫" title="No tickets for this client" description="Tickets they file in the portal, or that you log for them, show up here." />
      )}
    </div>
  );
}
