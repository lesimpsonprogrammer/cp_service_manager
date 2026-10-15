import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApiKey, unauthorized } from "@/lib/api-keys/auth";
import { notifyAssigned, notifyStatusChanged } from "@/lib/glass/notify";
import { apiUpdateTicketSchema, firstIssue } from "@/lib/glass/validation";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** GET /api/v1/tickets/:id — the ticket with its full conversation (API keys are staff-level). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();
  const { id } = await params;
  if (!UUID_RE.test(id)) return Response.json({ error: "Ticket not found." }, { status: 404 });

  const admin = createAdminClient();
  const { data: ticket } = await admin.from("tickets").select("*").eq("id", id).eq("org_id", auth.orgId).maybeSingle();
  if (!ticket) return Response.json({ error: "Ticket not found." }, { status: 404 });

  const [{ data: messages }, { data: attachments }, { data: events }] = await Promise.all([
    admin
      .from("ticket_messages")
      .select("id, author_type, author_name, body, is_internal, created_at")
      .eq("ticket_id", id)
      .order("created_at"),
    admin.from("ticket_attachments").select("id, message_id, file_name, content_type, size_bytes, created_at").eq("ticket_id", id),
    admin.from("ticket_events").select("event_type, from_value, to_value, actor_id, created_at").eq("ticket_id", id).order("created_at"),
  ]);

  return Response.json({ data: { ...ticket, messages, attachments, events } });
}

/** PATCH /api/v1/tickets/:id — update status, priority, type, assignee_id, category_id, tags, subject. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();
  const { id } = await params;
  if (!UUID_RE.test(id)) return Response.json({ error: "Ticket not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = apiUpdateTicketSchema.safeParse(body ?? {});
  if (!parsed.success) return Response.json({ error: firstIssue(parsed.error) }, { status: 400 });

  const admin = createAdminClient();
  const { data: before } = await admin
    .from("tickets")
    .select("status, assignee_id")
    .eq("id", id)
    .eq("org_id", auth.orgId)
    .maybeSingle();
  if (!before) return Response.json({ error: "Ticket not found." }, { status: 404 });

  const { data, error } = await admin
    .from("tickets")
    .update({ ...parsed.data, updated_by: null })
    .eq("id", id)
    .eq("org_id", auth.orgId)
    .select("id, ticket_number, status, priority, type, assignee_id, category_id, tags, subject, resolution_due_at, updated_at")
    .single();

  if (error || !data) {
    const glass = error?.message.match(/GLASS: (.+)$/);
    return Response.json({ error: glass ? glass[1] : "Couldn't update the ticket." }, { status: glass ? 422 : 500 });
  }

  if (parsed.data.status && parsed.data.status !== before.status) after(() => notifyStatusChanged(id, before.status, null));
  if (parsed.data.assignee_id && parsed.data.assignee_id !== before.assignee_id) after(() => notifyAssigned(id, null));

  return Response.json({ data });
}
