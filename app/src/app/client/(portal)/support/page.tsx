import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentClientPortalUser } from "@/lib/portal/getCurrentClientPortalUser";
import { canAccessPortalScreen, firstAccessiblePortalPath } from "@/lib/portal/permissions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TicketPriorityBadge, TicketStatusBadge } from "@/components/service-desk/TicketBadges";
import { LocalTime } from "@/components/service-desk/LocalTime";
import { TicketLiveRefresh } from "@/components/service-desk/TicketLiveRefresh";
import { cn } from "@/lib/utils/cn";
import { ACTIVE_STATUSES, DONE_STATUSES } from "@/lib/service-desk/constants";

const VIEWS = { open: "Open", done: "Resolved & closed", all: "All" } as const;
type View = keyof typeof VIEWS;

export default async function ClientSupportPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const clientUser = await getCurrentClientPortalUser();
  if (!clientUser) return null;
  if (!canAccessPortalScreen(clientUser.role, "support")) redirect(firstAccessiblePortalPath(clientUser.role));

  const { show } = await searchParams;
  const view: View = show === "done" || show === "all" ? show : "open";

  const supabase = await createClient();
  let query = supabase
    .from("tickets")
    .select("id, ticket_number, subject, status, priority, last_activity_at, requester_name, requester_user_id")
    .eq("client_id", clientUser.clientId);
  if (view === "open") query = query.in("status", ACTIVE_STATUSES);
  if (view === "done") query = query.in("status", DONE_STATUSES);
  const { data: tickets } = await query.order("last_activity_at", { ascending: false }).limit(200);

  const waiting = (tickets ?? []).filter((t) => t.status === "pending_client").length;

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            Support <TicketLiveRefresh clientId={clientUser.clientId} />
          </span>
        }
        description="Ask a question, report an issue, or request a change. You'll get an email whenever we reply."
        action={
          <Link href="/client/support/new">
            <Button size="sm">New request</Button>
          </Link>
        }
      />

      {waiting > 0 && view === "open" && (
        <p className="mb-4 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          {waiting} request{waiting === 1 ? " is" : "s are"} waiting on your reply.
        </p>
      )}

      <nav className="mb-3 flex gap-1" aria-label="Filter requests">
        {(Object.keys(VIEWS) as View[]).map((v) => (
          <Link
            key={v}
            href={v === "open" ? "/client/support" : `/client/support?show=${v}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              view === v ? "bg-brand/10 text-brand dark:text-white" : "text-muted hover:bg-surface-2 hover:text-foreground"
            )}
          >
            {VIEWS[v]}
          </Link>
        ))}
      </nav>

      {(tickets ?? []).length === 0 ? (
        <EmptyState
          icon="🎫"
          title={view === "open" ? "No open requests" : "Nothing here yet"}
          description="Need something from our team? Open a request and we'll pick it up."
          action={
            <Link href="/client/support/new">
              <Button size="sm">New request</Button>
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Request</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Priority</th>
                  <th className="px-5 py-3 font-medium">Opened by</th>
                  <th className="px-5 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(tickets ?? []).map((t) => (
                  <tr key={t.id} className="hover:bg-surface-2/60">
                    <td className="max-w-md px-5 py-3">
                      <Link href={`/client/support/${t.id}`} className="group block">
                        <span className="font-mono text-xs text-muted">{t.ticket_number}</span>
                        <span className="block truncate font-medium text-foreground group-hover:text-brand">{t.subject}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <TicketStatusBadge status={t.status} audience="client" />
                    </td>
                    <td className="px-5 py-3">
                      <TicketPriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {t.requester_user_id === clientUser.userId ? "You" : t.requester_name ?? "Our team"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted">
                      <LocalTime iso={t.last_activity_at} relative />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
