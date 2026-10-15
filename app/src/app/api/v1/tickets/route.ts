import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApiKey, unauthorized } from "@/lib/api-keys/auth";
import { notifyTicketCreated } from "@/lib/glass/notify";
import { fetchQueue, parseQueueFilters } from "@/lib/glass/queue";
import { firstIssue, parseApiCreateTicket, ticketStatusSchema } from "@/lib/glass/validation";

const PUBLIC_COLUMNS =
  "id, ticket_number, subject, description, status, priority, type, channel, client_id, project_id, category_id, assignee_id, requester_name, requester_email, client_visible, tags, first_response_due_at, resolution_due_at, first_responded_at, resolved_at, closed_at, satisfaction_rating, created_at, updated_at, last_activity_at";

/**
 * GET /api/v1/tickets — same filters as the dashboard queue
 * (?queue=open|unassigned|breached|waiting|resolved|all&priority=&type=&client=&category=&assignee=&q=&sort=),
 * plus ?status= for an exact status and ?limit= (max 500).
 */
export async function GET(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();

  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const filters = parseQueueFilters(params);
  if (filters.queue === "mine") filters.queue = "open"; // an API key isn't a person
  const limit = Math.min(Math.max(Number(params.limit) || 100, 1), 500);

  const status = params.status ? ticketStatusSchema.safeParse(params.status) : null;
  if (status && !status.success) return Response.json({ error: "Unknown `status`." }, { status: 400 });

  const rows = await fetchQueue(createAdminClient(), auth.orgId, "", filters, limit, status?.success ? status.data : null);
  return Response.json({ data: rows });
}

/** POST /api/v1/tickets — create a ticket (channel "api"). */
export async function POST(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = parseApiCreateTicket(body);
  if (!parsed.success) return Response.json({ error: firstIssue(parsed.error) }, { status: 400 });
  const input = parsed.data;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tickets")
    .insert({
      org_id: auth.orgId,
      subject: input.subject,
      description: input.description,
      priority: input.priority,
      type: input.type,
      status: input.status,
      channel: "api",
      client_id: input.client_id,
      project_id: input.project_id,
      category_id: input.category_id,
      assignee_id: input.assignee_id,
      requester_name: input.requester_name,
      requester_email: input.requester_email,
      tags: input.tags,
      client_visible: input.client_visible,
    })
    .select(PUBLIC_COLUMNS)
    .single();

  if (error || !data) {
    const glass = error?.message.match(/GLASS: (.+)$/);
    return Response.json({ error: glass ? glass[1] : "Couldn't create the ticket." }, { status: glass ? 422 : 500 });
  }

  after(() => notifyTicketCreated(data.id, null));
  return Response.json({ data }, { status: 201 });
}
