"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentClientPortalUser } from "@/lib/portal/getCurrentClientPortalUser";
import { canAccessPortalScreen } from "@/lib/portal/permissions";
import { checkAttachments, filesFromForm, storeAttachments } from "@/lib/glass/attachments";
import { notifyStatusChanged, notifyTicketCreated, notifyTicketReply } from "@/lib/glass/notify";
import { clientCreateTicketSchema, firstIssue, replySchema } from "@/lib/glass/validation";

export interface PortalFormState {
  error: string | null;
  success?: string | null;
}

/** New tickets a single portal user may open per hour — stops accidental (or scripted) floods. */
const MAX_NEW_TICKETS_PER_HOUR = 10;

async function requireSupportAccess() {
  const user = await getCurrentClientPortalUser();
  if (!user) return { user: null, error: "Your session expired — sign in again." } as const;
  if (!canAccessPortalScreen(user.role, "support")) return { user: null, error: "Your role doesn't include support requests." } as const;
  return { user, error: null } as const;
}

/**
 * Loads a ticket through the portal user's own RLS context — if they can't
 * see it, they can't act on it. Only then do writes use the service role.
 */
async function loadOwnTicket(ticketId: string, clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select("id, org_id, client_id, status")
    .eq("id", ticketId)
    .eq("client_id", clientId)
    .maybeSingle();
  return data;
}

async function displayName(userId: string, fallback: string | null) {
  const { data } = await createAdminClient().from("profiles").select("full_name").eq("id", userId).maybeSingle();
  return data?.full_name?.trim() || fallback || "Client";
}

function revalidate(ticketId: string, clientId: string) {
  revalidatePath("/client/support");
  revalidatePath(`/client/support/${ticketId}`);
  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath(`/clients/${clientId}/tickets`);
}

export async function createClientTicket(_prev: PortalFormState, formData: FormData): Promise<PortalFormState> {
  const { user, error: accessError } = await requireSupportAccess();
  if (!user) return { error: accessError };

  const parsed = clientCreateTicketSchema.safeParse({
    subject: formData.get("subject") ?? "",
    description: formData.get("description") ?? "",
    priority: formData.get("priority") || undefined,
    type: formData.get("type") || undefined,
    category_id: formData.get("category_id") ?? "",
    project_id: formData.get("project_id") ?? "",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const input = parsed.data;

  const attachments = checkAttachments(filesFromForm(formData));
  if (!attachments.ok) return { error: attachments.error };

  const admin = createAdminClient();

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("requester_user_id", user.userId)
    .gte("created_at", oneHourAgo);
  if ((count ?? 0) >= MAX_NEW_TICKETS_PER_HOUR) {
    return { error: "You've opened a lot of requests in the last hour. Add details to an existing one, or try again shortly." };
  }

  // Clients may only file under active categories / their own projects.
  if (input.category_id) {
    const { data: category } = await admin
      .from("ticket_categories")
      .select("id")
      .eq("id", input.category_id)
      .eq("org_id", user.orgId)
      .eq("is_active", true)
      .maybeSingle();
    if (!category) return { error: "That category isn't available. Pick another one." };
  }
  if (input.project_id) {
    const { data: project } = await admin
      .from("projects")
      .select("id")
      .eq("id", input.project_id)
      .eq("client_id", user.clientId)
      .maybeSingle();
    if (!project) return { error: "That project isn't available." };
  }

  const name = await displayName(user.userId, user.userEmail);
  const { data: ticket, error } = await admin
    .from("tickets")
    .insert({
      org_id: user.orgId,
      client_id: user.clientId,
      project_id: input.project_id,
      category_id: input.category_id,
      subject: input.subject,
      description: input.description,
      priority: input.priority,
      type: input.type,
      status: "new",
      channel: "portal",
      requester_user_id: user.userId,
      requester_name: name,
      requester_email: user.userEmail,
      created_by: user.userId,
      updated_by: user.userId,
    })
    .select("id")
    .single();

  if (error || !ticket) {
    console.error("GLASS portal ticket insert failed:", error);
    return { error: "We couldn't submit your request. Please try again." };
  }

  const stored = await storeAttachments(admin, attachments.files, {
    orgId: user.orgId,
    ticketId: ticket.id,
    messageId: null,
    uploadedBy: user.userId,
  });

  after(() => notifyTicketCreated(ticket.id, user.userId));
  revalidate(ticket.id, user.clientId);
  redirect(`/client/support/${ticket.id}${stored.error ? "?notice=attachment" : ""}`);
}

export async function replyAsClient(ticketId: string, _prev: PortalFormState, formData: FormData): Promise<PortalFormState> {
  const { user, error: accessError } = await requireSupportAccess();
  if (!user) return { error: accessError };

  const ticket = await loadOwnTicket(ticketId, user.clientId);
  if (!ticket) return { error: "Request not found." };
  if (ticket.status === "closed") return { error: "This request is closed. Open a new one and mention its number." };

  const parsed = replySchema.safeParse({ body: formData.get("body") ?? "" });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const attachments = checkAttachments(filesFromForm(formData));
  if (!attachments.ok) return { error: attachments.error };

  const admin = createAdminClient();
  const { data: message, error } = await admin
    .from("ticket_messages")
    .insert({
      ticket_id: ticket.id,
      org_id: ticket.org_id,
      author_id: user.userId,
      author_type: "client",
      author_name: await displayName(user.userId, user.userEmail),
      body: parsed.data.body,
      is_internal: false,
    })
    .select("id")
    .single();

  if (error || !message) {
    console.error("GLASS portal reply failed:", error);
    return { error: "We couldn't send your reply. Please try again." };
  }

  const stored = await storeAttachments(admin, attachments.files, {
    orgId: ticket.org_id,
    ticketId: ticket.id,
    messageId: message.id,
    uploadedBy: user.userId,
  });

  after(() => notifyTicketReply(ticket.id, message.id));
  revalidate(ticket.id, user.clientId);
  if (stored.error) return { error: `Reply sent, but an attachment didn't upload — ${stored.error}` };
  return { error: null, success: "Reply sent." };
}

export async function setTicketStatusAsClient(ticketId: string, action: "close" | "reopen"): Promise<PortalFormState> {
  const { user, error: accessError } = await requireSupportAccess();
  if (!user) return { error: accessError };

  const ticket = await loadOwnTicket(ticketId, user.clientId);
  if (!ticket) return { error: "Request not found." };

  const next = action === "close" ? "closed" : "open";
  if (action === "close" && ticket.status === "closed") return { error: null };
  if (action === "reopen" && ticket.status !== "resolved") {
    return { error: "Only resolved requests can be reopened — closed ones need a new request." };
  }

  const { error } = await createAdminClient()
    .from("tickets")
    .update({ status: next, updated_by: user.userId })
    .eq("id", ticket.id)
    .eq("client_id", user.clientId);
  if (error) return { error: "We couldn't update the request. Please try again." };

  after(() => notifyStatusChanged(ticket.id, ticket.status, user.userId));
  revalidate(ticket.id, user.clientId);
  return { error: null };
}

const ratingSchema = z.object({
  rating: z.coerce.number().int().min(1, "Pick a rating.").max(5),
  comment: z.string().trim().max(2000).transform((v) => v || null),
});

export async function rateTicket(ticketId: string, _prev: PortalFormState, formData: FormData): Promise<PortalFormState> {
  const { user, error: accessError } = await requireSupportAccess();
  if (!user) return { error: accessError };

  const ticket = await loadOwnTicket(ticketId, user.clientId);
  if (!ticket) return { error: "Request not found." };
  if (ticket.status !== "resolved" && ticket.status !== "closed") return { error: "You can rate a request once it's resolved." };

  const parsed = ratingSchema.safeParse({ rating: formData.get("rating"), comment: formData.get("comment") ?? "" });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { error } = await createAdminClient()
    .from("tickets")
    .update({
      satisfaction_rating: parsed.data.rating,
      satisfaction_comment: parsed.data.comment,
      updated_by: user.userId,
    })
    .eq("id", ticket.id)
    .eq("client_id", user.clientId);
  if (error) return { error: "We couldn't save your rating. Please try again." };

  revalidate(ticket.id, user.clientId);
  return { error: null, success: "Thanks for the feedback!" };
}
