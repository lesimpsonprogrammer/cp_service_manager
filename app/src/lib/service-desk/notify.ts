import { createAdminClient } from "@/lib/supabase/admin";
import { sendServiceDeskTicketEmail } from "@/lib/email/resend";
import { dispatchEvent } from "@/lib/webhooks/dispatch";
import type { TicketStatus } from "@/types/database";
import { CLIENT_STATUS_LABELS, PRIORITY_LABELS, STATUS_LABELS, WEBHOOK_EVENTS } from "./constants";
import { getUserEmails } from "./people";
import { chatReturnUrl, isOnline } from "@/lib/chat/widget";

// Every notification here is best-effort: it runs after the response (see
// `after()` in the callers), loads fresh state with the service role, and
// swallows its own failures so email/webhook outages never fail a ticket write.

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "";
export const staffTicketUrl = (id: string) => `${appUrl()}/tickets/${id}`;
export const portalTicketUrl = (id: string) => `${appUrl()}/client/support/${id}`;
export const chatInboxUrl = (id: string) => `${appUrl()}/chat?c=${id}`;

type Admin = ReturnType<typeof createAdminClient>;

/** Where the requester follows up: the portal for clients, the website chat for chats. */
async function requesterTicketUrl(
  admin: Admin,
  ticket: { id: string; org_id: string; client_id: string | null; channel: string }
): Promise<string> {
  if (ticket.client_id) return portalTicketUrl(ticket.id);
  if (ticket.channel === "chat") {
    const { data } = await admin.from("chat_widget_settings").select("site_url").eq("org_id", ticket.org_id).maybeSingle();
    return chatReturnUrl(data?.site_url);
  }
  return staffTicketUrl(ticket.id);
}

/** A chat visitor with the widget open sees the reply there; no email needed. */
async function chatVisitorIsOnline(admin: Admin, ticket: { id: string; channel: string }): Promise<boolean> {
  if (ticket.channel !== "chat") return false;
  const { data } = await admin.from("chat_sessions").select("last_seen_at").eq("ticket_id", ticket.id).maybeSingle();
  return isOnline(data?.last_seen_at);
}

async function loadTicket(ticketId: string) {
  const admin = createAdminClient();
  const { data: ticket } = await admin
    .from("tickets")
    .select(
      "id, org_id, ticket_number, subject, status, priority, client_id, client_visible, assignee_id, requester_user_id, requester_email, requester_name, channel, created_by, description"
    )
    .eq("id", ticketId)
    .maybeSingle();
  return { admin, ticket };
}

/** The requester's address, if the ticket has someone outside the team to update. */
async function requesterEmail(
  admin: ReturnType<typeof createAdminClient>,
  ticket: { requester_email: string | null; requester_user_id: string | null; client_id: string | null; client_visible: boolean }
): Promise<string | null> {
  // Internal-only tickets about a client never email that client.
  if (ticket.client_id && !ticket.client_visible) return null;
  if (ticket.requester_email) return ticket.requester_email;
  if (!ticket.requester_user_id) return null;
  const emails = await getUserEmails(admin, [ticket.requester_user_id]);
  return emails.get(ticket.requester_user_id) ?? null;
}

async function staffRecipients(
  admin: ReturnType<typeof createAdminClient>,
  ticket: { id: string; assignee_id: string | null },
  excludeUserId: string | null
): Promise<string[]> {
  const { data: watchers } = await admin.from("ticket_watchers").select("user_id").eq("ticket_id", ticket.id);
  const ids = [ticket.assignee_id, ...(watchers ?? []).map((w) => w.user_id)].filter(
    (id): id is string => !!id && id !== excludeUserId
  );
  const emails = await getUserEmails(admin, ids);
  return Array.from(new Set(emails.values()));
}

async function safely(label: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (err) {
    console.error(`Service Desk notification failed (${label}):`, err);
  }
}

export async function notifyTicketCreated(ticketId: string, actorId: string | null) {
  await safely("created", async () => {
    const { admin, ticket } = await loadTicket(ticketId);
    if (!ticket) return;

    const staff = await staffRecipients(admin, ticket, actorId);
    if (staff.length && ticket.channel === "chat") {
      await sendServiceDeskTicketEmail({
        to: staff,
        subject: `[${ticket.ticket_number}] New chat from ${ticket.requester_name ?? ticket.requester_email ?? "a visitor"}`,
        heading: "Someone is chatting on your website",
        intro: `${ticket.requester_name ?? "A visitor"}${ticket.requester_email ? ` (${ticket.requester_email})` : ""} started a chat. Answer while they're still on the page.`,
        quote: ticket.description,
        ctaLabel: "Answer in Live Chat",
        ctaUrl: chatInboxUrl(ticket.id),
      });
    } else if (staff.length) {
      await sendServiceDeskTicketEmail({
        to: staff,
        subject: `[${ticket.ticket_number}] New ${PRIORITY_LABELS[ticket.priority].toLowerCase()} ticket: ${ticket.subject}`,
        heading: `${ticket.ticket_number} · ${ticket.subject}`,
        intro: `A new ticket was opened${ticket.requester_name ? ` by ${ticket.requester_name}` : ""} and is assigned to you.`,
        ctaLabel: "Open the ticket in the Service Desk",
        ctaUrl: staffTicketUrl(ticket.id),
      });
    }

    // Confirm receipt to whoever raised it from outside the team.
    if (ticket.channel !== "staff") {
      const to = await requesterEmail(admin, ticket);
      if (to) {
        const chat = ticket.channel === "chat";
        await sendServiceDeskTicketEmail({
          to,
          subject: `[${ticket.ticket_number}] We received your ${chat ? "message" : "request"}: ${ticket.subject}`,
          heading: `We've got it — ${ticket.ticket_number}`,
          intro: chat
            ? "Thanks for chatting with us. We'll answer in the chat on our website, and email you here if you've stepped away."
            : "Thanks for reaching out. Your request is in our queue and you'll get an email each time we reply.",
          ctaLabel: chat ? "Open the chat" : "Track this request",
          ctaUrl: await requesterTicketUrl(admin, ticket),
        });
      }
    }

    await dispatchEvent(admin, ticket.org_id, WEBHOOK_EVENTS.created, {
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      client_id: ticket.client_id,
      channel: ticket.channel,
    });
  });
}

export async function notifyTicketReply(ticketId: string, messageId: string) {
  await safely("reply", async () => {
    const { admin, ticket } = await loadTicket(ticketId);
    if (!ticket) return;
    const { data: message } = await admin
      .from("ticket_messages")
      .select("id, author_id, author_type, author_name, body, is_internal")
      .eq("id", messageId)
      .maybeSingle();
    if (!message) return;

    if (message.author_type === "client") {
      const staff = await staffRecipients(admin, ticket, null);
      if (staff.length) {
        await sendServiceDeskTicketEmail({
          to: staff,
          subject:
            ticket.channel === "chat"
              ? `[${ticket.ticket_number}] New chat message from ${message.author_name ?? "a visitor"}`
              : `[${ticket.ticket_number}] Client replied: ${ticket.subject}`,
          heading: `${message.author_name ?? "The client"} ${ticket.channel === "chat" ? "wrote in the chat" : "replied"}`,
          intro: `New ${ticket.channel === "chat" ? "message" : "reply"} on ${ticket.ticket_number}.`,
          quote: message.body,
          ctaLabel: ticket.channel === "chat" ? "Answer in Live Chat" : "Respond in the Service Desk",
          ctaUrl: ticket.channel === "chat" ? chatInboxUrl(ticket.id) : staffTicketUrl(ticket.id),
        });
      }
    } else if (message.is_internal) {
      // Internal notes go to the rest of the team on the ticket only.
      const staff = await staffRecipients(admin, ticket, message.author_id);
      if (staff.length) {
        await sendServiceDeskTicketEmail({
          to: staff,
          subject: `[${ticket.ticket_number}] Internal note: ${ticket.subject}`,
          heading: `${message.author_name ?? "A teammate"} added an internal note`,
          intro: `Internal note on ${ticket.ticket_number} (not visible to the client).`,
          quote: message.body,
          ctaLabel: "Open the ticket in the Service Desk",
          ctaUrl: staffTicketUrl(ticket.id),
        });
      }
      return;
    } else {
      const to = (await chatVisitorIsOnline(admin, ticket)) ? null : await requesterEmail(admin, ticket);
      if (to) {
        await sendServiceDeskTicketEmail({
          to,
          subject: `[${ticket.ticket_number}] New reply: ${ticket.subject}`,
          heading: `${message.author_name ?? "Our team"} replied to your request`,
          intro: `There's an update on ${ticket.ticket_number}.`,
          quote: message.body,
          ctaLabel: ticket.channel === "chat" ? "Reply in the chat" : "View and reply",
          ctaUrl: await requesterTicketUrl(admin, ticket),
        });
      }
    }

    await dispatchEvent(admin, ticket.org_id, WEBHOOK_EVENTS.replied, {
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      message_id: message.id,
      author_type: message.author_type,
      status: ticket.status,
    });
  });
}

export async function notifyStatusChanged(ticketId: string, from: TicketStatus, actorId: string | null) {
  await safely("status", async () => {
    const { admin, ticket } = await loadTicket(ticketId);
    if (!ticket || ticket.status === from) return;

    if (ticket.status === "resolved" || ticket.status === "pending_client") {
      const to = await requesterEmail(admin, ticket);
      if (to && ticket.requester_user_id !== actorId) {
        const resolved = ticket.status === "resolved";
        await sendServiceDeskTicketEmail({
          to,
          subject: `[${ticket.ticket_number}] ${resolved ? "Resolved" : "Waiting on your reply"}: ${ticket.subject}`,
          heading: resolved ? `${ticket.ticket_number} is resolved` : `We need a bit more from you on ${ticket.ticket_number}`,
          intro: resolved
            ? "We've marked your request as resolved. If anything's still off, just reply and it reopens automatically — otherwise let us know how we did."
            : "Our team is waiting on information from you before we can continue.",
          ctaLabel: ticket.channel === "chat" ? "Open the chat" : resolved ? "Review and rate" : "Reply now",
          ctaUrl: await requesterTicketUrl(admin, ticket),
        });
      }
    }

    const staff = await staffRecipients(admin, ticket, actorId);
    if (staff.length) {
      await sendServiceDeskTicketEmail({
        to: staff,
        subject: `[${ticket.ticket_number}] ${STATUS_LABELS[from]} → ${STATUS_LABELS[ticket.status]}`,
        heading: `${ticket.ticket_number} is now ${STATUS_LABELS[ticket.status].toLowerCase()}`,
        intro: `${ticket.subject} moved from "${STATUS_LABELS[from]}" to "${STATUS_LABELS[ticket.status]}". The client sees "${CLIENT_STATUS_LABELS[ticket.status]}".`,
        ctaLabel: "Open the ticket in the Service Desk",
        ctaUrl: staffTicketUrl(ticket.id),
      });
    }

    await dispatchEvent(admin, ticket.org_id, WEBHOOK_EVENTS.statusChanged, {
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      from,
      to: ticket.status,
    });
  });
}

export async function notifyAssigned(ticketId: string, actorId: string | null) {
  await safely("assigned", async () => {
    const { admin, ticket } = await loadTicket(ticketId);
    if (!ticket?.assignee_id || ticket.assignee_id === actorId) return;
    const emails = await getUserEmails(admin, [ticket.assignee_id]);
    const to = emails.get(ticket.assignee_id);
    if (!to) return;
    await sendServiceDeskTicketEmail({
      to,
      subject: `[${ticket.ticket_number}] Assigned to you: ${ticket.subject}`,
      heading: `${ticket.ticket_number} is yours`,
      intro: `You're now the owner of "${ticket.subject}" (${PRIORITY_LABELS[ticket.priority]} priority).`,
      ctaLabel: "Open the ticket in the Service Desk",
      ctaUrl: staffTicketUrl(ticket.id),
    });
  });
}
