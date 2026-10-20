import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TicketPriority, TicketStatus, TicketType } from "@/types/database";
import { ACTIVE_STATUSES, DONE_STATUSES, PAUSED_STATUSES, PRIORITY_RANK, TICKET_PRIORITIES, TICKET_TYPES } from "./constants";
import { getSlaSnapshot } from "./sla";
import { sanitizeSearch } from "./validation";

export const QUEUES = ["open", "mine", "unassigned", "breached", "waiting", "resolved", "all"] as const;
export type QueueName = (typeof QUEUES)[number];

export const QUEUE_LABELS: Record<QueueName, string> = {
  open: "All open",
  mine: "Assigned to me",
  unassigned: "Unassigned",
  breached: "SLA breached",
  waiting: "Waiting",
  resolved: "Resolved & closed",
  all: "Everything",
};

export const SORTS = ["activity", "priority", "due", "created"] as const;
export type QueueSort = (typeof SORTS)[number];

export const SORT_LABELS: Record<QueueSort, string> = {
  activity: "Latest activity",
  priority: "Priority",
  due: "SLA due",
  created: "Newest",
};

export interface QueueFilters {
  queue: QueueName;
  view: "list" | "board";
  sort: QueueSort;
  q: string;
  priority: TicketPriority | null;
  type: TicketType | null;
  clientId: string | null;
  categoryId: string | null;
  assigneeId: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function pickNullable<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

function uuidOrNull(value: unknown): string | null {
  return typeof value === "string" && UUID_RE.test(value) ? value : null;
}

/** Reads queue filters from URL search params, ignoring anything malformed. */
export function parseQueueFilters(params: Record<string, string | string[] | undefined>): QueueFilters {
  const get = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    queue: pick(get("queue"), QUEUES, "open"),
    view: get("view") === "board" ? "board" : "list",
    sort: pick(get("sort"), SORTS, "activity"),
    q: sanitizeSearch(get("q")),
    priority: pickNullable(get("priority"), TICKET_PRIORITIES),
    type: pickNullable(get("type"), TICKET_TYPES),
    clientId: uuidOrNull(get("client")),
    categoryId: uuidOrNull(get("category")),
    assigneeId: uuidOrNull(get("assignee")),
  };
}

/** Serializes filters back to a query string, dropping defaults, with overrides applied. */
export function queueHref(filters: QueueFilters, overrides: Partial<QueueFilters> = {}, base = "/tickets"): string {
  const f = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (f.queue !== "open") params.set("queue", f.queue);
  if (f.view !== "list") params.set("view", f.view);
  if (f.sort !== "activity") params.set("sort", f.sort);
  if (f.q) params.set("q", f.q);
  if (f.priority) params.set("priority", f.priority);
  if (f.type) params.set("type", f.type);
  if (f.clientId) params.set("client", f.clientId);
  if (f.categoryId) params.set("category", f.categoryId);
  if (f.assigneeId) params.set("assignee", f.assigneeId);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export const QUEUE_COLUMNS =
  "id, ticket_number, subject, status, priority, type, channel, client_id, category_id, assignee_id, requester_name, requester_email, tags, first_response_due_at, resolution_due_at, first_responded_at, resolved_at, sla_paused_at, last_activity_at, created_at, satisfaction_rating" as const;

export type QueueRow = Pick<
  Database["public"]["Tables"]["tickets"]["Row"],
  | "id"
  | "ticket_number"
  | "subject"
  | "status"
  | "priority"
  | "type"
  | "channel"
  | "client_id"
  | "category_id"
  | "assignee_id"
  | "requester_name"
  | "requester_email"
  | "tags"
  | "first_response_due_at"
  | "resolution_due_at"
  | "first_responded_at"
  | "resolved_at"
  | "sla_paused_at"
  | "last_activity_at"
  | "created_at"
  | "satisfaction_rating"
>;

const STATUSES_FOR_QUEUE: Record<QueueName, TicketStatus[] | null> = {
  open: ACTIVE_STATUSES,
  mine: ACTIVE_STATUSES,
  unassigned: ACTIVE_STATUSES,
  breached: ACTIVE_STATUSES,
  waiting: PAUSED_STATUSES,
  resolved: DONE_STATUSES,
  all: null,
};

/**
 * Runs the queue query (RLS-scoped `db`) and applies the SLA-based queue
 * and sort in memory, since "breached" depends on pause state the database
 * can't express in a single filter.
 */
export async function fetchQueue(
  db: SupabaseClient<Database>,
  orgId: string,
  userId: string,
  filters: QueueFilters,
  limit = 500,
  exactStatus: TicketStatus | null = null
): Promise<QueueRow[]> {
  let query = db.from("tickets").select(QUEUE_COLUMNS).eq("org_id", orgId);

  const statuses = STATUSES_FOR_QUEUE[filters.queue];
  if (exactStatus) query = query.eq("status", exactStatus);
  else if (statuses) query = query.in("status", statuses);
  if (filters.queue === "mine") query = query.eq("assignee_id", userId);
  if (filters.queue === "unassigned") query = query.is("assignee_id", null);
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.clientId) query = query.eq("client_id", filters.clientId);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.assigneeId) query = query.eq("assignee_id", filters.assigneeId);
  if (filters.q) {
    // Quoted so dots/spaces in emails and phrases survive PostgREST's filter grammar.
    const term = `"%${filters.q}%"`;
    query = query.or(`subject.ilike.${term},ticket_number.ilike.${term},requester_email.ilike.${term},requester_name.ilike.${term}`);
  }

  const { data } = await query.order("last_activity_at", { ascending: false }).limit(limit);
  let rows = (data ?? []) as QueueRow[];

  const now = new Date();
  if (filters.queue === "breached") {
    rows = rows.filter((r) => getSlaSnapshot(r, now).overall === "breached");
  }

  return sortRows(rows, filters.sort);
}

export function sortRows(rows: QueueRow[], sort: QueueSort): QueueRow[] {
  const copy = [...rows];
  const time = (iso: string | null) => (iso ? new Date(iso).getTime() : Number.POSITIVE_INFINITY);
  switch (sort) {
    case "priority":
      return copy.sort(
        (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || time(a.resolution_due_at) - time(b.resolution_due_at)
      );
    case "due":
      return copy.sort((a, b) => time(a.resolution_due_at) - time(b.resolution_due_at));
    case "created":
      return copy.sort((a, b) => time(b.created_at) - time(a.created_at));
    default:
      return copy.sort((a, b) => time(b.last_activity_at) - time(a.last_activity_at));
  }
}

/** RFC 4180 CSV cell; also neutralizes spreadsheet formula injection. */
export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : Array.isArray(value) ? value.join("; ") : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
