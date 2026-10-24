import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { getOrgMembers } from "@/lib/org/getOrgMembers";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TicketStatusBadge } from "@/components/service-desk/TicketBadges";
import { TicketThread } from "@/components/service-desk/TicketThread";
import { LocalTime } from "@/components/service-desk/LocalTime";
import { ChatInboxLive } from "@/components/chat/ChatInboxLive";
import { ChatReplyBox } from "@/components/chat/ChatReplyBox";
import { ACTIVE_STATUSES, DONE_STATUSES } from "@/lib/service-desk/constants";
import { isOnline } from "@/lib/chat/widget";
import { cn } from "@/lib/utils/cn";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function LiveChatPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; view?: string }>;
}) {
  const org = await getCurrentOrg();
  if (!org) redirect("/login");
  const { c, view: viewParam } = await searchParams;
  const view = viewParam === "done" ? "done" : "open";
  const isAdmin = org.role === "owner" || org.role === "admin";

  const supabase = await createClient();
  const [{ data: widget }, { data: chats }, { count: openCount }] = await Promise.all([
    supabase.from("chat_widget_settings").select("is_enabled, widget_key").eq("org_id", org.orgId).maybeSingle(),
    supabase
      .from("tickets")
      .select("id, ticket_number, subject, status, requester_name, requester_email, description, created_at, last_activity_at, assignee_id")
      .eq("org_id", org.orgId)
      .eq("channel", "chat")
      .in("status", view === "done" ? DONE_STATUSES : ACTIVE_STATUSES)
      .order("last_activity_at", { ascending: false })
      .limit(100),
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org.orgId)
      .eq("channel", "chat")
      .in("status", ACTIVE_STATUSES),
  ]);

  const list = chats ?? [];
  const ids = list.map((t) => t.id);
  const selectedId = c && UUID_RE.test(c) ? c : list[0]?.id ?? null;

  const [{ data: sessions }, { data: latest }] = ids.length
    ? await Promise.all([
        supabase.from("chat_sessions").select("ticket_id, last_seen_at, page_url").in("ticket_id", ids),
        supabase
          .from("ticket_messages")
          .select("ticket_id, author_type, body, created_at")
          .in("ticket_id", ids)
          .eq("is_internal", false)
          .order("created_at", { ascending: false })
          .limit(1000),
      ])
    : [{ data: [] }, { data: [] }];

  const sessionByTicket = new Map((sessions ?? []).map((s) => [s.ticket_id, s]));
  const lastByTicket = new Map<string, { author_type: string; body: string }>();
  for (const m of latest ?? []) if (!lastByTicket.has(m.ticket_id)) lastByTicket.set(m.ticket_id, m);

  // The open conversation, which may be from the other tab (e.g. a link from an email).
  const { data: selected } = selectedId
    ? await supabase
        .from("tickets")
        .select("id, ticket_number, status, requester_name, requester_email, description, created_at")
        .eq("id", selectedId)
        .eq("org_id", org.orgId)
        .eq("channel", "chat")
        .maybeSingle()
    : { data: null };

  const [members, { data: messages }, { data: attachments }, { data: macros }, { data: selectedSession }] = selected
    ? await Promise.all([
        getOrgMembers(org.orgId),
        supabase
          .from("ticket_messages")
          .select("id, author_type, author_name, body, is_internal, created_at")
          .eq("ticket_id", selected.id)
          .order("created_at"),
        supabase.from("ticket_attachments").select("id, message_id, file_name, size_bytes").eq("ticket_id", selected.id),
        supabase.from("ticket_macros").select("id, name, body").eq("org_id", org.orgId).order("name"),
        supabase
          .from("chat_sessions")
          .select("last_seen_at, page_url, user_agent, created_at")
          .eq("ticket_id", selected.id)
          .maybeSingle(),
      ])
    : [[], { data: [] }, { data: [] }, { data: [] }, { data: null }];

  const memberNames = new Map(members.map((m) => [m.userId, m.fullName]));
  const canEdit = org.role !== "viewer";
  const visitorName = (t: { requester_name: string | null; requester_email: string | null }) =>
    t.requester_name || t.requester_email || "Website visitor";

  const header = (
    <PageHeader
      title="Live Chat"
      description="Conversations from the chat bubble on your website. Every chat is also a Service Desk ticket."
      action={
        <div className="flex flex-col items-end gap-2">
          <ChatInboxLive orgId={org.orgId} />
          {isAdmin && (
            <Link href="/chat/settings" className="text-xs text-muted hover:text-foreground">
              Chat widget settings →
            </Link>
          )}
        </div>
      }
    />
  );

  if (!widget?.is_enabled && list.length === 0 && !selected) {
    return (
      <div>
        {header}
        <EmptyState
          icon="💬"
          title={widget ? "The chat bubble is turned off" : "Set up the website chat"}
          description="Turn on the chat widget and add its one-line snippet to your website. New chats show up here instantly."
          action={
            isAdmin ? (
              <Link href="/chat/settings" className="text-sm font-medium text-brand hover:underline">
                Open chat widget settings
              </Link>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div>
      {header}
      <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card className={cn("overflow-hidden", c && "hidden lg:block")}>
          <div className="flex border-b border-border text-sm" role="tablist" aria-label="Chats">
            {(
              [
                ["open", `Open${openCount ? ` (${openCount})` : ""}`],
                ["done", "Resolved"],
              ] as const
            ).map(([key, label]) => (
              <Link
                key={key}
                href={key === "open" ? "/chat" : "/chat?view=done"}
                role="tab"
                aria-selected={view === key}
                className={cn(
                  "flex-1 px-3 py-2.5 text-center font-medium",
                  view === key ? "border-b-2 border-brand text-foreground" : "text-muted hover:text-foreground"
                )}
              >
                {label}
              </Link>
            ))}
          </div>
          {list.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted">
              {view === "open" ? "No open chats. You're all caught up." : "No resolved chats yet."}
            </p>
          ) : (
            <ul className="max-h-[70vh] divide-y divide-border overflow-y-auto">
              {list.map((t) => {
                const last = lastByTicket.get(t.id);
                const waiting = !DONE_STATUSES.includes(t.status) && (!last || last.author_type === "client");
                const online = isOnline(sessionByTicket.get(t.id)?.last_seen_at);
                const preview = last?.body ?? t.description;
                return (
                  <li key={t.id}>
                    <Link
                      href={`/chat?c=${t.id}${view === "done" ? "&view=done" : ""}`}
                      className={cn(
                        "block px-4 py-3 hover:bg-surface-2",
                        t.id === selectedId && "bg-surface-2"
                      )}
                      aria-current={t.id === selectedId ? "true" : undefined}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className={cn("h-2 w-2 shrink-0 rounded-full", online ? "bg-success" : "bg-border-strong")}
                            title={online ? "On the website now" : "Away"}
                          />
                          <span className={cn("truncate text-sm", waiting ? "font-semibold text-foreground" : "text-foreground")}>
                            {visitorName(t)}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-muted">
                          <LocalTime iso={t.last_activity_at} />
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted">
                        {last?.author_type === "staff" && "You: "}
                        {preview}
                      </p>
                      {waiting && <p className="mt-1 text-xs font-medium text-brand">Waiting on your reply</p>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className={cn("min-w-0", !c && !selected && "hidden lg:block")}>
          {selected ? (
            <div className="space-y-3">
              <Card className="p-4">
                <Link href={view === "done" ? "/chat?view=done" : "/chat"} className="mb-2 block text-xs text-muted hover:text-foreground lg:hidden">
                  ← All chats
                </Link>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-base font-semibold text-foreground">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          isOnline(selectedSession?.last_seen_at) ? "bg-success" : "bg-border-strong"
                        )}
                      />
                      {visitorName(selected)}
                    </p>
                    {selected.requester_email && (
                      <a href={`mailto:${selected.requester_email}`} className="break-all text-sm text-brand hover:underline">
                        {selected.requester_email}
                      </a>
                    )}
                    <p className="mt-1 text-xs text-muted">
                      {isOnline(selectedSession?.last_seen_at) ? (
                        "On the website now. Replies show up in their chat right away."
                      ) : (
                        <>
                          Away{selectedSession?.last_seen_at && (
                            <>
                              {" "}since <LocalTime iso={selectedSession.last_seen_at} />
                            </>
                          )}
                          . Your reply is emailed to them.
                        </>
                      )}
                    </p>
                    {selectedSession?.page_url && (
                      <p className="mt-1 truncate text-xs text-muted">
                        Started on{" "}
                        <a href={selectedSession.page_url} target="_blank" rel="noreferrer" className="hover:text-foreground">
                          {selectedSession.page_url.replace(/^https?:\/\//, "")}
                        </a>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <TicketStatusBadge status={selected.status} />
                    <Link href={`/tickets/${selected.id}`} className="font-mono text-xs text-muted hover:text-foreground">
                      {selected.ticket_number} → full ticket
                    </Link>
                  </div>
                </div>
              </Card>

              <TicketThread
                description={selected.description}
                openedBy={visitorName(selected)}
                openedAt={selected.created_at}
                messages={messages ?? []}
                attachments={attachments ?? []}
                audience="staff"
              />

              {canEdit ? (
                <ChatReplyBox
                  ticketId={selected.id}
                  status={selected.status}
                  macros={macros ?? []}
                  macroVars={{
                    requester_name: selected.requester_name ?? "there",
                    ticket_number: selected.ticket_number,
                    subject: "",
                    client_name: "",
                    agent_name: memberNames.get(org.userId) ?? "",
                  }}
                />
              ) : (
                <p className="text-sm text-muted">You have view-only access to Live Chat.</p>
              )}
            </div>
          ) : (
            <Card className="flex h-full min-h-[16rem] items-center justify-center p-8 text-sm text-muted">
              Pick a chat on the left.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
