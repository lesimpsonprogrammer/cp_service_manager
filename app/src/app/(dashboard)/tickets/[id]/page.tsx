import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { getOrgMembers } from "@/lib/org/getOrgMembers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TicketPriorityBadge, TicketStatusBadge, SlaClockRow } from "@/components/glass/TicketBadges";
import { TicketThread } from "@/components/glass/TicketThread";
import { TicketReplyComposer } from "@/components/glass/TicketReplyComposer";
import { TicketPropertiesForm } from "@/components/glass/TicketPropertiesForm";
import { TicketActivity } from "@/components/glass/TicketActivity";
import { TicketLiveRefresh } from "@/components/glass/TicketLiveRefresh";
import { DeleteTicketButton, WatchButton } from "@/components/glass/TicketHeaderActions";
import { LocalTime } from "@/components/glass/LocalTime";
import { CHANNEL_LABELS, CLIENT_STATUS_LABELS, TYPE_LABELS } from "@/lib/glass/constants";
import { formatDuration, getSlaSnapshot } from "@/lib/glass/sla";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const org = await getCurrentOrg();
  if (!org) redirect("/login");
  const { id } = await params;
  const { notice } = await searchParams;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const { data: ticket } = await supabase.from("tickets").select("*").eq("id", id).eq("org_id", org.orgId).maybeSingle();
  if (!ticket) notFound();

  const [
    members,
    { data: messages },
    { data: attachments },
    { data: events },
    { data: watchers },
    { data: clients },
    { data: projects },
    { data: categories },
    { data: macros },
    { data: relatedTickets },
  ] = await Promise.all([
    getOrgMembers(org.orgId),
    supabase
      .from("ticket_messages")
      .select("id, author_type, author_name, author_id, body, is_internal, created_at")
      .eq("ticket_id", id)
      .order("created_at"),
    supabase.from("ticket_attachments").select("id, message_id, file_name, size_bytes").eq("ticket_id", id).order("created_at"),
    supabase
      .from("ticket_events")
      .select("id, actor_id, event_type, from_value, to_value, created_at")
      .eq("ticket_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("ticket_watchers").select("user_id").eq("ticket_id", id),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("projects").select("id, name, project_code, client_id").order("name"),
    supabase.from("ticket_categories").select("id, name, is_active").eq("org_id", org.orgId).order("name"),
    supabase.from("ticket_macros").select("id, name, body").eq("org_id", org.orgId).order("name"),
    ticket.client_id
      ? supabase
          .from("tickets")
          .select("id, ticket_number, subject, status")
          .eq("client_id", ticket.client_id)
          .neq("id", id)
          .order("last_activity_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] as { id: string; ticket_number: string; subject: string; status: "new" }[] }),
  ]);

  const memberNames = new Map(members.map((m) => [m.userId, m.fullName]));
  // Client-portal actors aren't readable through staff profiles; fall back to names they posted under.
  const people = new Map(memberNames);
  if (ticket.requester_user_id && ticket.requester_name) people.set(ticket.requester_user_id, ticket.requester_name);
  for (const m of messages ?? []) if (m.author_id && m.author_name && !people.has(m.author_id)) people.set(m.author_id, m.author_name);

  const clientNames = new Map((clients ?? []).map((c) => [c.id, c.name]));
  const categoryNames = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const clientName = ticket.client_id ? clientNames.get(ticket.client_id) ?? null : null;
  const project = ticket.project_id ? (projects ?? []).find((p) => p.id === ticket.project_id) : null;

  const sla = getSlaSnapshot(ticket);
  const watching = (watchers ?? []).some((w) => w.user_id === org.userId);
  const canEdit = org.role !== "viewer";
  const isAdmin = org.role === "owner" || org.role === "admin";
  const internalOnly = !!ticket.client_id && !ticket.client_visible;
  const canReplyPublicly = !internalOnly && !!(ticket.requester_email || ticket.requester_user_id);
  const openedBy =
    ticket.requester_name ?? ticket.requester_email ?? (ticket.created_by ? memberNames.get(ticket.created_by) : null) ?? "Someone";

  return (
    <div>
      <TicketLiveRefresh ticketId={ticket.id} showIndicator={false} />
      <div className="mb-1 flex items-center gap-2 text-sm text-muted">
        <Link href="/tickets" className="hover:text-foreground">
          ← GLASS Tickets
        </Link>
      </div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted">{ticket.ticket_number}</p>
          <h2 className="break-words text-lg font-semibold tracking-tight text-foreground">{ticket.subject}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
            <span className="text-xs text-muted">
              {TYPE_LABELS[ticket.type]} · via {CHANNEL_LABELS[ticket.channel]}
              {ticket.client_id && !internalOnly && ` · client sees "${CLIENT_STATUS_LABELS[ticket.status]}"`}
            </span>
            {internalOnly && (
              <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                Internal only — hidden from client
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WatchButton ticketId={ticket.id} watching={watching} />
          {isAdmin && <DeleteTicketButton ticketId={ticket.id} ticketNumber={ticket.ticket_number} />}
        </div>
      </div>

      {notice && (
        <p className="mb-4 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning" role="status">
          Ticket created, but: {notice}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          <TicketThread
            description={ticket.description}
            openedBy={openedBy}
            openedAt={ticket.created_at}
            messages={messages ?? []}
            attachments={attachments ?? []}
            audience="staff"
          />
          {canEdit ? (
            <>
              {!canReplyPublicly && (
                <p className="text-xs text-muted">
                  {internalOnly
                    ? "This ticket is hidden from the client, so replies are internal notes. Make it visible in Properties to reply to them."
                    : "No requester email on this ticket, so replies are internal notes. Add a client or requester to reply externally."}
                </p>
              )}
              <TicketReplyComposer
                ticketId={ticket.id}
                currentStatus={ticket.status}
                macros={macros ?? []}
                canReplyPublicly={canReplyPublicly}
                macroVars={{
                  requester_name: ticket.requester_name ?? "there",
                  ticket_number: ticket.ticket_number,
                  subject: ticket.subject,
                  client_name: clientName ?? "",
                  agent_name: memberNames.get(org.userId) ?? "",
                }}
              />
            </>
          ) : (
            <p className="text-sm text-muted">You have view-only access to GLASS.</p>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SLA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <SlaClockRow label="First response" clock={sla.firstResponse} />
              <SlaClockRow label="Resolution" clock={sla.resolution} />
              <div className="space-y-1 pt-1 text-xs text-muted">
                <p>
                  Resolution due <LocalTime iso={ticket.resolution_due_at} />
                </p>
                {ticket.sla_paused_seconds > 0 && <p>Paused for {formatDuration(ticket.sla_paused_seconds / 60)} total while waiting.</p>}
                {ticket.reopened_count > 0 && <p>Reopened {ticket.reopened_count}×</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketPropertiesForm
                ticketId={ticket.id}
                value={ticket}
                clients={clients ?? []}
                projects={projects ?? []}
                categories={categories ?? []}
                members={members}
                disabled={!canEdit}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requester</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <p className="text-foreground">{ticket.requester_name ?? "—"}</p>
              {ticket.requester_email && (
                <a href={`mailto:${ticket.requester_email}`} className="block break-all text-brand hover:underline">
                  {ticket.requester_email}
                </a>
              )}
              {clientName && (
                <Link href={`/clients/${ticket.client_id}/tickets`} className="block text-muted hover:text-foreground">
                  {clientName} →
                </Link>
              )}
              {project && (
                <p className="text-xs text-muted">
                  Project {project.project_code} · {project.name}
                </p>
              )}
              <p className="text-xs text-muted">
                Opened <LocalTime iso={ticket.created_at} />
              </p>
              {ticket.satisfaction_rating && (
                <div className="mt-2 rounded-md border border-border bg-surface-2 p-2 text-xs">
                  <p className="font-medium text-foreground">
                    Rated {"★".repeat(ticket.satisfaction_rating)}
                    {"☆".repeat(5 - ticket.satisfaction_rating)}
                  </p>
                  {ticket.satisfaction_comment && <p className="mt-1 whitespace-pre-wrap text-muted">{ticket.satisfaction_comment}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {(watchers ?? []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Watchers</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted">
                {(watchers ?? []).map((w) => memberNames.get(w.user_id) ?? "Former teammate").join(", ")}
              </CardContent>
            </Card>
          )}

          {(relatedTickets ?? []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Other tickets from {clientName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(relatedTickets ?? []).map((t) => (
                  <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-center justify-between gap-2 text-sm hover:text-brand">
                    <span className="min-w-0 truncate">
                      <span className="font-mono text-xs text-muted">{t.ticket_number}</span> {t.subject}
                    </span>
                    <TicketStatusBadge status={t.status} />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketActivity events={events ?? []} names={{ people, clients: clientNames, categories: categoryNames }} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
