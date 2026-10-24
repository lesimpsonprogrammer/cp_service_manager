import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadChatTicket, loadSessionByToken, loadVisibleMessages, touchSession } from "@/lib/chat/service";
import {
  MAX_MESSAGES_PER_MINUTE,
  STAFF_RENOTIFY_MINUTES,
  bearerToken,
  chatJson,
  chatMessageSchema,
  firstChatIssue,
  preflight,
  toVisitorMessages,
} from "@/lib/chat/widget";
import { notifyTicketReply } from "@/lib/service-desk/notify";

/**
 * Public, token-authenticated: the visitor's one conversation.
 *   GET  -> the conversation so far (the widget polls this)
 *   POST -> the visitor sends another message
 * A closed chat answers 410 so the widget offers a fresh one.
 */

async function resolve(request: Request) {
  const token = bearerToken(request);
  if (!token) return null;
  const admin = createAdminClient();
  const session = await loadSessionByToken(admin, token);
  if (!session) return null;
  const ticket = await loadChatTicket(admin, session.ticket_id);
  if (!ticket) return null;
  return { admin, session, ticket };
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const found = await resolve(request);
  if (!found) return chatJson({ error: "Chat not found." }, origin, { status: 404 });
  const { admin, session, ticket } = found;

  const messages = await loadVisibleMessages(admin, ticket.id);
  await touchSession(admin, session);

  return chatJson({ status: ticket.status, messages: toVisitorMessages(ticket, messages) }, origin, {
    status: ticket.status === "closed" ? 410 : 200,
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const found = await resolve(request);
  if (!found) return chatJson({ error: "Chat not found." }, origin, { status: 404 });
  const { admin, session, ticket } = found;

  if (ticket.status === "closed") {
    return chatJson({ error: "This chat was closed. Start a new one and we'll pick it up." }, origin, { status: 410 });
  }

  const parsed = chatMessageSchema.safeParse((await request.json().catch(() => null)) ?? {});
  if (!parsed.success) return chatJson({ error: firstChatIssue(parsed.error) }, origin, { status: 400 });

  const since = new Date(Date.now() - 60 * 1000).toISOString();
  const { count } = await admin
    .from("ticket_messages")
    .select("id", { count: "exact", head: true })
    .eq("ticket_id", ticket.id)
    .eq("author_type", "client")
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_MESSAGES_PER_MINUTE) {
    return chatJson({ error: "You're sending messages quickly. Give it a moment and try again." }, origin, { status: 429 });
  }

  const { data: message, error } = await admin
    .from("ticket_messages")
    .insert({
      ticket_id: ticket.id,
      org_id: ticket.org_id,
      author_id: null,
      author_type: "client",
      author_name: session.visitor_name ?? session.visitor_email,
      body: parsed.data.message,
      is_internal: false,
    })
    .select("id")
    .single();

  if (error || !message) {
    console.error("chat message: insert failed", error);
    return chatJson({ error: "Your message didn't send. Please try again." }, origin, { status: 500 });
  }

  // One email per burst of messages, not one per line.
  const now = new Date();
  const lastNotified = session.staff_notified_at ? new Date(session.staff_notified_at).getTime() : 0;
  const notify = now.getTime() - lastNotified >= STAFF_RENOTIFY_MINUTES * 60 * 1000;
  await admin
    .from("chat_sessions")
    .update({ last_seen_at: now.toISOString(), ...(notify ? { staff_notified_at: now.toISOString() } : {}) })
    .eq("id", session.id);
  if (notify) after(() => notifyTicketReply(ticket.id, message.id));

  const [fresh, messages] = await Promise.all([
    loadChatTicket(admin, ticket.id),
    loadVisibleMessages(admin, ticket.id),
  ]);
  return chatJson({ status: fresh?.status ?? ticket.status, messages: toVisitorMessages(fresh ?? ticket, messages) }, origin);
}

export const OPTIONS = preflight;
