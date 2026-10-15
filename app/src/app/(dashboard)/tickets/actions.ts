"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { checkAttachments, filesFromForm, storeAttachments } from "@/lib/glass/attachments";
import { getDisplayNames } from "@/lib/glass/people";
import { notifyAssigned, notifyStatusChanged, notifyTicketCreated, notifyTicketReply } from "@/lib/glass/notify";
import {
  bulkUpdateSchema,
  categorySchema,
  firstIssue,
  macroSchema,
  replySchema,
  slaPolicySchema,
  staffCreateTicketSchema,
  ticketPropertiesSchema,
  ticketStatusSchema,
} from "@/lib/glass/validation";
import { ATTACHMENTS_BUCKET, TICKET_PRIORITIES } from "@/lib/glass/constants";
import type { TicketStatus } from "@/types/database";

export interface GlassFormState {
  error: string | null;
  success?: string | null;
}

const ADMIN_ROLES = new Set(["owner", "admin"]);

/** Viewers are read-only in GLASS (RLS enforces it too; this gives a clear message). */
async function requireEditor() {
  const org = await getCurrentOrg();
  if (!org) return { org: null, error: "Not signed in." } as const;
  if (org.role === "viewer") return { org: null, error: "Viewers can't change tickets." } as const;
  return { org, error: null } as const;
}

async function requireAdmin() {
  const org = await getCurrentOrg();
  if (!org) return { org: null, error: "Not signed in." } as const;
  if (!ADMIN_ROLES.has(org.role)) return { org: null, error: "Only workspace admins can change GLASS settings." } as const;
  return { org, error: null } as const;
}

/** Turns trigger/constraint errors into something a person can act on. */
function friendlyDbError(message: string | undefined, fallback: string): string {
  if (!message) return fallback;
  const glass = message.match(/GLASS: (.+)$/);
  if (glass) return glass[1]!.charAt(0).toUpperCase() + glass[1]!.slice(1) + ".";
  if (message.includes("row-level security")) return "You don't have permission to do that.";
  return message;
}

function revalidateTicket(ticketId?: string, clientId?: string | null) {
  revalidatePath("/tickets");
  if (ticketId) revalidatePath(`/tickets/${ticketId}`);
  if (clientId) revalidatePath(`/clients/${clientId}/tickets`);
  revalidatePath("/client/support");
  if (ticketId) revalidatePath(`/client/support/${ticketId}`);
}

// ---------------------------------------------------------------------------
// Tickets
// ---------------------------------------------------------------------------

export async function createTicket(_prev: GlassFormState, formData: FormData): Promise<GlassFormState> {
  const { org, error: authError } = await requireEditor();
  if (!org) return { error: authError };

  const parsed = staffCreateTicketSchema.safeParse({
    subject: formData.get("subject") ?? "",
    description: formData.get("description") ?? "",
    priority: formData.get("priority") || undefined,
    type: formData.get("type") || undefined,
    status: formData.get("status") || undefined,
    client_id: formData.get("client_id") ?? "",
    project_id: formData.get("project_id") ?? "",
    category_id: formData.get("category_id") ?? "",
    assignee_id: formData.get("assignee_id") ?? "",
    requester_name: formData.get("requester_name") ?? "",
    requester_email: formData.get("requester_email") ?? "",
    tags: formData.get("tags") ?? "",
    client_visible: formData.get("client_visible") === "on",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const input = parsed.data;

  const attachments = checkAttachments(filesFromForm(formData));
  if (!attachments.ok) return { error: attachments.error };

  const supabase = await createClient();

  // Default the requester to the client's primary contact so replies reach someone.
  let requesterName = input.requester_name;
  let requesterEmail = input.requester_email;
  if (input.client_id && !requesterEmail) {
    const { data: client } = await supabase
      .from("clients")
      .select("primary_contact_name, primary_contact_email")
      .eq("id", input.client_id)
      .maybeSingle();
    requesterName = requesterName ?? client?.primary_contact_name ?? null;
    requesterEmail = client?.primary_contact_email ?? null;
  }

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      org_id: org.orgId,
      subject: input.subject,
      description: input.description,
      priority: input.priority,
      type: input.type,
      status: input.status,
      channel: "staff",
      client_id: input.client_id,
      project_id: input.project_id,
      category_id: input.category_id,
      assignee_id: input.assignee_id,
      requester_name: requesterName,
      requester_email: requesterEmail,
      tags: input.tags,
      client_visible: input.client_visible,
      created_by: org.userId,
    })
    .select("id, client_id")
    .single();

  if (error || !ticket) return { error: friendlyDbError(error?.message, "Couldn't create the ticket.") };

  const stored = await storeAttachments(supabase, attachments.files, {
    orgId: org.orgId,
    ticketId: ticket.id,
    messageId: null,
    uploadedBy: org.userId,
  });

  after(() => notifyTicketCreated(ticket.id, org.userId));
  revalidateTicket(ticket.id, ticket.client_id);
  redirect(`/tickets/${ticket.id}${stored.error ? `?notice=${encodeURIComponent(stored.error)}` : ""}`);
}

export async function updateTicketProperties(
  ticketId: string,
  _prev: GlassFormState,
  formData: FormData
): Promise<GlassFormState> {
  const { org, error: authError } = await requireEditor();
  if (!org) return { error: authError };

  const parsed = ticketPropertiesSchema.safeParse({
    subject: formData.get("subject") ?? "",
    status: formData.get("status"),
    priority: formData.get("priority"),
    type: formData.get("type"),
    client_id: formData.get("client_id") ?? "",
    project_id: formData.get("project_id") ?? "",
    category_id: formData.get("category_id") ?? "",
    assignee_id: formData.get("assignee_id") ?? "",
    tags: formData.get("tags") ?? "",
    client_visible: formData.get("client_visible") === "on",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const input = parsed.data;

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("tickets")
    .select("status, assignee_id, client_id")
    .eq("id", ticketId)
    .maybeSingle();
  if (!before) return { error: "Ticket not found." };

  const { error } = await supabase
    .from("tickets")
    .update({
      subject: input.subject,
      status: input.status,
      priority: input.priority,
      type: input.type,
      client_id: input.client_id,
      project_id: input.project_id,
      category_id: input.category_id,
      assignee_id: input.assignee_id,
      tags: input.tags,
      client_visible: input.client_visible,
      updated_by: org.userId,
    })
    .eq("id", ticketId);

  if (error) return { error: friendlyDbError(error.message, "Couldn't save changes.") };

  if (before.status !== input.status) after(() => notifyStatusChanged(ticketId, before.status, org.userId));
  if (input.assignee_id && before.assignee_id !== input.assignee_id) after(() => notifyAssigned(ticketId, org.userId));

  revalidateTicket(ticketId, input.client_id ?? before.client_id);
  return { error: null, success: "Saved." };
}

export async function postTicketReply(
  ticketId: string,
  _prev: GlassFormState,
  formData: FormData
): Promise<GlassFormState> {
  const { org, error: authError } = await requireEditor();
  if (!org) return { error: authError };

  const parsed = replySchema.safeParse({ body: formData.get("body") ?? "" });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const isInternal = formData.get("visibility") === "internal";
  const nextStatusRaw = String(formData.get("next_status") ?? "");
  const nextStatus = nextStatusRaw ? ticketStatusSchema.safeParse(nextStatusRaw) : null;
  if (nextStatus && !nextStatus.success) return { error: "Pick a valid status." };

  const attachments = checkAttachments(filesFromForm(formData));
  if (!attachments.ok) return { error: attachments.error };

  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, status, client_id")
    .eq("id", ticketId)
    .maybeSingle();
  if (!ticket) return { error: "Ticket not found." };

  const names = await getDisplayNames(supabase, [org.userId]);

  const { data: message, error } = await supabase
    .from("ticket_messages")
    .insert({
      ticket_id: ticketId,
      org_id: org.orgId,
      author_id: org.userId,
      author_type: "staff",
      author_name: names.get(org.userId) ?? org.userEmail ?? "Support team",
      body: parsed.data.body,
      is_internal: isInternal,
    })
    .select("id")
    .single();

  if (error || !message) return { error: friendlyDbError(error?.message, "Couldn't post the reply.") };

  const stored = await storeAttachments(supabase, attachments.files, {
    orgId: org.orgId,
    ticketId,
    messageId: message.id,
    uploadedBy: org.userId,
  });

  // Status as it stands after the message trigger (a first public reply moves new → open).
  const { data: afterReply } = await supabase.from("tickets").select("status").eq("id", ticketId).maybeSingle();
  const statusNow = afterReply?.status ?? ticket.status;
  let statusError: string | null = null;

  if (nextStatus?.success && nextStatus.data !== statusNow) {
    const { error: updateError } = await supabase
      .from("tickets")
      .update({ status: nextStatus.data, updated_by: org.userId })
      .eq("id", ticketId);
    if (updateError) statusError = friendlyDbError(updateError.message, "Reply posted, but the status didn't change.");
  }

  after(async () => {
    await notifyTicketReply(ticketId, message.id);
    if (nextStatus?.success && nextStatus.data !== ticket.status && !statusError) {
      await notifyStatusChanged(ticketId, ticket.status, org.userId);
    }
  });

  revalidateTicket(ticketId, ticket.client_id);
  if (stored.error) return { error: `Reply posted, but an attachment failed — ${stored.error}` };
  if (statusError) return { error: statusError };
  return { error: null, success: isInternal ? "Internal note added." : "Reply sent." };
}

export async function bulkUpdateTickets(_prev: GlassFormState, formData: FormData): Promise<GlassFormState> {
  const { org, error: authError } = await requireEditor();
  if (!org) return { error: authError };

  const parsed = bulkUpdateSchema.safeParse({
    ticket_ids: formData.getAll("ticket_ids").map(String),
    status: formData.get("bulk_status") || undefined,
    priority: formData.get("bulk_priority") || undefined,
    assignee_id: formData.get("bulk_assignee") || undefined,
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { ticket_ids, status, priority, assignee_id } = parsed.data;

  const supabase = await createClient();
  const { data: before } = await supabase.from("tickets").select("id, status, assignee_id").in("id", ticket_ids);
  if (!before?.length) return { error: "None of those tickets were found." };

  const changes: { status?: TicketStatus; priority?: typeof priority; assignee_id?: string | null; updated_by: string } = {
    updated_by: org.userId,
  };
  if (status) changes.status = status;
  if (priority) changes.priority = priority;
  if (assignee_id) changes.assignee_id = assignee_id === "unassigned" ? null : assignee_id;

  const { error } = await supabase.from("tickets").update(changes).in("id", ticket_ids);
  if (error) return { error: friendlyDbError(error.message, "Bulk update failed.") };

  after(async () => {
    for (const row of before) {
      if (status && row.status !== status) await notifyStatusChanged(row.id, row.status, org.userId);
      if (changes.assignee_id && row.assignee_id !== changes.assignee_id) await notifyAssigned(row.id, org.userId);
    }
  });

  revalidatePath("/tickets");
  revalidatePath("/clients/[id]/tickets", "page");
  return { error: null, success: `Updated ${before.length} ticket${before.length === 1 ? "" : "s"}.` };
}

export async function toggleTicketWatch(ticketId: string, watch: boolean) {
  const org = await getCurrentOrg();
  if (!org) return;
  const supabase = await createClient();
  if (watch) {
    await supabase.from("ticket_watchers").upsert(
      { ticket_id: ticketId, user_id: org.userId, org_id: org.orgId },
      { onConflict: "ticket_id,user_id", ignoreDuplicates: true }
    );
  } else {
    await supabase.from("ticket_watchers").delete().eq("ticket_id", ticketId).eq("user_id", org.userId);
  }
  revalidatePath(`/tickets/${ticketId}`);
}

export async function deleteTicket(ticketId: string) {
  const { org } = await requireAdmin();
  if (!org) return;
  const supabase = await createClient();
  const { data: files } = await supabase.from("ticket_attachments").select("storage_path").eq("ticket_id", ticketId);
  const { error } = await supabase.from("tickets").delete().eq("id", ticketId);
  if (!error && files?.length) {
    await createAdminClient().storage.from(ATTACHMENTS_BUCKET).remove(files.map((f) => f.storage_path));
  }
  revalidatePath("/tickets");
  redirect("/tickets");
}

// ---------------------------------------------------------------------------
// Settings: SLA policies, categories, macros
// ---------------------------------------------------------------------------

export async function saveSlaPolicies(_prev: GlassFormState, formData: FormData): Promise<GlassFormState> {
  const { org, error: authError } = await requireAdmin();
  if (!org) return { error: authError };

  const rows = [];
  for (const priority of TICKET_PRIORITIES) {
    const firstHours = Number(formData.get(`${priority}_first_response_hours`));
    const resolutionHours = Number(formData.get(`${priority}_resolution_hours`));
    const parsed = slaPolicySchema.safeParse({
      priority,
      first_response_minutes: Math.round(firstHours * 60),
      resolution_minutes: Math.round(resolutionHours * 60),
    });
    if (!parsed.success) return { error: `${priority}: ${firstIssue(parsed.error)}` };
    rows.push({ ...parsed.data, org_id: org.orgId, updated_by: org.userId, updated_at: new Date().toISOString() });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ticket_sla_policies").upsert(rows, { onConflict: "org_id,priority" });
  if (error) return { error: friendlyDbError(error.message, "Couldn't save SLA targets.") };

  revalidatePath("/tickets/settings");
  return { error: null, success: "SLA targets saved. They apply to new tickets and to priority changes." };
}

export async function createTicketCategory(_prev: GlassFormState, formData: FormData): Promise<GlassFormState> {
  const { org, error: authError } = await requireAdmin();
  if (!org) return { error: authError };

  const parsed = categorySchema.safeParse({
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    default_assignee_id: formData.get("default_assignee_id") ?? "",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("ticket_categories").insert({ ...parsed.data, org_id: org.orgId });
  if (error) {
    return { error: error.code === "23505" ? "A category with that name already exists." : friendlyDbError(error.message, "Couldn't add the category.") };
  }

  revalidatePath("/tickets/settings");
  return { error: null, success: "Category added." };
}

export async function setTicketCategoryActive(categoryId: string, isActive: boolean) {
  const { org } = await requireAdmin();
  if (!org) return;
  const supabase = await createClient();
  await supabase.from("ticket_categories").update({ is_active: isActive }).eq("id", categoryId);
  revalidatePath("/tickets/settings");
}

export async function deleteTicketCategory(categoryId: string) {
  const { org } = await requireAdmin();
  if (!org) return;
  const supabase = await createClient();
  await supabase.from("ticket_categories").delete().eq("id", categoryId);
  revalidatePath("/tickets/settings");
}

export async function createTicketMacro(_prev: GlassFormState, formData: FormData): Promise<GlassFormState> {
  const { org, error: authError } = await requireEditor();
  if (!org) return { error: authError };

  const parsed = macroSchema.safeParse({ name: formData.get("name") ?? "", body: formData.get("body") ?? "" });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ticket_macros")
    .insert({ ...parsed.data, org_id: org.orgId, created_by: org.userId });
  if (error) {
    return { error: error.code === "23505" ? "A macro with that name already exists." : friendlyDbError(error.message, "Couldn't save the macro.") };
  }

  revalidatePath("/tickets/settings");
  return { error: null, success: "Macro saved." };
}

export async function deleteTicketMacro(macroId: string) {
  const { org } = await requireEditor();
  if (!org) return;
  const supabase = await createClient();
  await supabase.from("ticket_macros").delete().eq("id", macroId);
  revalidatePath("/tickets/settings");
}
