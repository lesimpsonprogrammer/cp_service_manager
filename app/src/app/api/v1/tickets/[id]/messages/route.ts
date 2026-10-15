import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApiKey, unauthorized } from "@/lib/api-keys/auth";
import { notifyTicketReply } from "@/lib/glass/notify";
import { apiMessageSchema, firstIssue } from "@/lib/glass/validation";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/v1/tickets/:id/messages — { body, is_internal?, author_name? }.
 * A public message is a staff-side reply: it emails the requester and counts
 * as the first response.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();
  const { id } = await params;
  if (!UUID_RE.test(id)) return Response.json({ error: "Ticket not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = apiMessageSchema.safeParse(body ?? {});
  if (!parsed.success) return Response.json({ error: firstIssue(parsed.error) }, { status: 400 });

  const admin = createAdminClient();
  const { data: ticket } = await admin.from("tickets").select("id, org_id").eq("id", id).eq("org_id", auth.orgId).maybeSingle();
  if (!ticket) return Response.json({ error: "Ticket not found." }, { status: 404 });

  const { data, error } = await admin
    .from("ticket_messages")
    .insert({
      ticket_id: ticket.id,
      org_id: ticket.org_id,
      author_id: null,
      author_type: "staff",
      author_name: parsed.data.author_name || "API integration",
      body: parsed.data.body,
      is_internal: parsed.data.is_internal,
    })
    .select("id, author_type, author_name, body, is_internal, created_at")
    .single();

  if (error || !data) return Response.json({ error: "Couldn't add the message." }, { status: 500 });

  after(() => notifyTicketReply(ticket.id, data.id));
  return Response.json({ data }, { status: 201 });
}
