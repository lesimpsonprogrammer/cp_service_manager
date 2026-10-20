import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentClientPortalUser } from "@/lib/portal/getCurrentClientPortalUser";
import { canAccessPortalScreen, firstAccessiblePortalPath } from "@/lib/portal/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TicketPriorityBadge, TicketStatusBadge } from "@/components/service-desk/TicketBadges";
import { TicketThread } from "@/components/service-desk/TicketThread";
import { TicketLiveRefresh } from "@/components/service-desk/TicketLiveRefresh";
import { LocalTime } from "@/components/service-desk/LocalTime";
import {
  ClientRatingForm,
  ClientReplyForm,
  ClientStatusButton,
} from "@/components/service-desk/ClientPortalTicketForms";
import { TYPE_LABELS } from "@/lib/service-desk/constants";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ClientTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const clientUser = await getCurrentClientPortalUser();
  if (!clientUser) return null;
  if (!canAccessPortalScreen(clientUser.role, "support")) redirect(firstAccessiblePortalPath(clientUser.role));

  const { id } = await params;
  const { notice } = await searchParams;
  if (!UUID_RE.test(id)) notFound();

  // RLS: portal users only see their own client's tickets and public messages.
  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select(
      "id, ticket_number, subject, description, status, priority, type, assignee_id, requester_name, requester_user_id, created_at, resolved_at, satisfaction_rating, satisfaction_comment"
    )
    .eq("id", id)
    .eq("client_id", clientUser.clientId)
    .maybeSingle();
  if (!ticket) notFound();

  const [{ data: messages }, { data: attachments }] = await Promise.all([
    supabase
      .from("ticket_messages")
      .select("id, author_type, author_name, body, is_internal, created_at")
      .eq("ticket_id", id)
      .eq("is_internal", false)
      .order("created_at"),
    supabase.from("ticket_attachments").select("id, message_id, file_name, size_bytes").eq("ticket_id", id).order("created_at"),
  ]);

  // Only the assignee's display name is exposed, looked up after the RLS check above.
  const { data: assignee } = ticket.assignee_id
    ? await createAdminClient().from("profiles").select("full_name").eq("id", ticket.assignee_id).maybeSingle()
    : { data: null };

  const done = ticket.status === "resolved" || ticket.status === "closed";

  return (
    <div className="max-w-4xl">
      <TicketLiveRefresh ticketId={ticket.id} showIndicator={false} />
      <div className="mb-1 text-sm text-muted">
        <Link href="/client/support" className="hover:text-foreground">
          ← Support
        </Link>
      </div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted">{ticket.ticket_number}</p>
          <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">{ticket.subject}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TicketStatusBadge status={ticket.status} audience="client" />
            <TicketPriorityBadge priority={ticket.priority} />
            <span className="text-xs text-muted">{TYPE_LABELS[ticket.type]}</span>
          </div>
        </div>
        {ticket.status === "resolved" ? (
          <ClientStatusButton ticketId={ticket.id} action="reopen" />
        ) : ticket.status !== "closed" ? (
          <ClientStatusButton ticketId={ticket.id} action="close" />
        ) : null}
      </div>

      {notice && (
        <p className="mb-4 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning" role="status">
          Your request was submitted, but an attachment didn&apos;t upload. Add it in a reply below.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0 space-y-4">
          <TicketThread
            description={ticket.description}
            openedBy={ticket.requester_user_id === clientUser.userId ? "You" : ticket.requester_name ?? "Our team"}
            openedAt={ticket.created_at}
            messages={messages ?? []}
            attachments={attachments ?? []}
            audience="client"
          />

          {ticket.status === "pending_client" && (
            <p className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
              Our team is waiting on your reply to keep going.
            </p>
          )}

          {ticket.status !== "closed" ? (
            <ClientReplyForm ticketId={ticket.id} resolved={ticket.status === "resolved"} />
          ) : (
            <p className="text-sm text-muted">
              This request is closed. Need more help?{" "}
              <Link href="/client/support/new" className="text-brand hover:underline">
                Open a new request
              </Link>{" "}
              and mention {ticket.ticket_number}.
            </p>
          )}

          {done && !ticket.satisfaction_rating && <ClientRatingForm ticketId={ticket.id} />}
          {ticket.satisfaction_rating && (
            <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success" role="status">
              Thanks for the feedback! You rated this request {ticket.satisfaction_rating}/5.
            </p>
          )}
        </div>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-muted">Assigned to</p>
                <p className="text-foreground">{assignee?.full_name ?? "Our support team"}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Opened</p>
                <p className="text-foreground">
                  <LocalTime iso={ticket.created_at} />
                </p>
              </div>
              {ticket.resolved_at && (
                <div>
                  <p className="text-xs text-muted">Resolved</p>
                  <p className="text-foreground">
                    <LocalTime iso={ticket.resolved_at} />
                  </p>
                </div>
              )}
              {ticket.satisfaction_rating && (
                <div>
                  <p className="text-xs text-muted">Your rating</p>
                  <p className="text-warning">
                    {"★".repeat(ticket.satisfaction_rating)}
                    <span className="text-muted">{"★".repeat(5 - ticket.satisfaction_rating)}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
