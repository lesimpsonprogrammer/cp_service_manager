import type { QueueRow } from "@/lib/service-desk/queue";
import { SlaBadge } from "./TicketBadges";
import type { QueueTableRow } from "./TicketQueue";

/** Joins queue rows with display names and a server-time SLA badge. */
export function buildQueueRows(
  rows: QueueRow[],
  lookups: {
    clientNames: Map<string, string>;
    memberNames: Map<string, string>;
    categoryNames: Map<string, string>;
  },
  now = new Date()
): QueueTableRow[] {
  return rows.map((r) => ({
    id: r.id,
    ticketNumber: r.ticket_number,
    subject: r.subject,
    status: r.status,
    priority: r.priority,
    clientName: r.client_id ? lookups.clientNames.get(r.client_id) ?? "Unknown client" : null,
    assigneeName: r.assignee_id ? lookups.memberNames.get(r.assignee_id) ?? "Former teammate" : null,
    requester: r.requester_name ?? r.requester_email,
    categoryName: r.category_id ? lookups.categoryNames.get(r.category_id) ?? null : null,
    tags: r.tags,
    lastActivityAt: r.last_activity_at,
    sla: <SlaBadge ticket={r} now={now} />,
  }));
}
