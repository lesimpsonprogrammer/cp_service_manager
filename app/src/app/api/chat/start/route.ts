import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadWidget, resolveChatAssignee } from "@/lib/chat/service";
import {
  MAX_NEW_CHATS_PER_HOUR,
  chatJson,
  chatSubject,
  clientIp,
  firstChatIssue,
  hashIp,
  hashToken,
  isOriginAllowed,
  newVisitorToken,
  preflight,
  startChatSchema,
  toVisitorMessages,
} from "@/lib/chat/widget";
import { notifyTicketCreated } from "@/lib/service-desk/notify";

/**
 * Public: a website visitor starts a chat. Opens a Service Desk ticket
 * (channel 'chat') assigned to the widget's owner, and hands the browser a
 * token it uses for every later read/write of this one conversation.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const body = await request.json().catch(() => null);
  const parsed = startChatSchema.safeParse(body ?? {});
  if (!parsed.success) return chatJson({ error: firstChatIssue(parsed.error) }, origin, { status: 400 });
  const input = parsed.data;

  const admin = createAdminClient();
  const widget = await loadWidget(admin, input.key);
  if (!widget || !widget.is_enabled || !isOriginAllowed(origin, widget.allowed_origins)) {
    return chatJson({ error: "Chat is not available here." }, origin, { status: 404 });
  }

  const token = newVisitorToken();

  // Bots fill the hidden field. Answer like it worked, store nothing.
  if (input.website) {
    return chatJson({ token, status: "new", messages: [] }, origin);
  }

  const ipHash = hashIp(clientIp(request), widget.org_id);
  if (ipHash) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("chat_sessions")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if ((count ?? 0) >= MAX_NEW_CHATS_PER_HOUR) {
      return chatJson(
        { error: "You've started several chats in a short time. Please continue in your open chat or try again later." },
        origin,
        { status: 429 }
      );
    }
  }

  const assigneeId = await resolveChatAssignee(admin, widget.org_id, widget.default_assignee_id);

  const { data: ticket, error } = await admin
    .from("tickets")
    .insert({
      org_id: widget.org_id,
      subject: chatSubject(input.message),
      description: input.message,
      channel: "chat",
      type: "question",
      priority: "normal",
      status: "new",
      assignee_id: assigneeId,
      requester_name: input.name,
      requester_email: input.email,
      tags: ["website-chat"],
    })
    .select("id, org_id, status, description, created_at, requester_name")
    .single();

  if (error || !ticket) {
    console.error("chat start: ticket insert failed", error);
    return chatJson({ error: "We couldn't start the chat. Please try again in a moment." }, origin, { status: 500 });
  }

  const { error: sessionError } = await admin.from("chat_sessions").insert({
    org_id: widget.org_id,
    ticket_id: ticket.id,
    token_hash: hashToken(token),
    visitor_name: input.name,
    visitor_email: input.email,
    page_url: input.page_url,
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    ip_hash: ipHash,
    staff_notified_at: new Date().toISOString(),
  });

  if (sessionError) {
    // Without a session the visitor can never see the reply in the widget;
    // the ticket still has their email, so the team can answer there.
    console.error("chat start: session insert failed", sessionError);
    after(() => notifyTicketCreated(ticket.id, null));
    return chatJson({ error: "We got your message but couldn't open the live chat. We'll reply by email." }, origin, {
      status: 500,
    });
  }

  after(() => notifyTicketCreated(ticket.id, null));

  return chatJson({ token, status: ticket.status, messages: toVisitorMessages(ticket, []) }, origin);
}

export const OPTIONS = preflight;
