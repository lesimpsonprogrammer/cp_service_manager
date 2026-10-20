import { PRIORITY_LABELS, STATUS_LABELS, TYPE_LABELS } from "@/lib/service-desk/constants";
import type { TicketPriority, TicketStatus, TicketType } from "@/types/database";
import { LocalTime } from "./LocalTime";

export interface TicketEventRow {
  id: string;
  actor_id: string | null;
  event_type: string;
  from_value: string | null;
  to_value: string | null;
  created_at: string;
}

/** Human-readable audit trail; ids are resolved through the lookups passed in. */
export function TicketActivity({
  events,
  names,
}: {
  events: TicketEventRow[];
  names: { people: Map<string, string>; clients: Map<string, string>; categories: Map<string, string> };
}) {
  const person = (id: string | null) => (id ? names.people.get(id) ?? "Someone" : "System");
  const describe = (e: TicketEventRow): string => {
    const label = (map: Map<string, string>, v: string | null, empty: string) => (v ? map.get(v) ?? "a removed item" : empty);
    switch (e.event_type) {
      case "created":
        return "opened the ticket";
      case "status":
        return `changed status ${STATUS_LABELS[e.from_value as TicketStatus] ?? e.from_value} → ${STATUS_LABELS[e.to_value as TicketStatus] ?? e.to_value}`;
      case "priority":
        return `changed priority ${PRIORITY_LABELS[e.from_value as TicketPriority] ?? e.from_value} → ${PRIORITY_LABELS[e.to_value as TicketPriority] ?? e.to_value}`;
      case "type":
        return `changed type to ${TYPE_LABELS[e.to_value as TicketType] ?? e.to_value}`;
      case "assignee":
        return e.to_value ? `assigned to ${label(names.people, e.to_value, "")}` : "unassigned the ticket";
      case "category":
        return `set category to ${label(names.categories, e.to_value, "none")}`;
      case "client":
        return `linked client ${label(names.clients, e.to_value, "none (internal)")}`;
      case "client_visible":
        return e.to_value === "true" ? "made the ticket visible to the client" : "hid the ticket from the client";
      case "subject":
        return "edited the subject";
      case "tags":
        return e.to_value ? `set tags: ${e.to_value}` : "cleared tags";
      case "reply":
        return e.to_value === "client" ? "replied (client)" : "sent a public reply";
      case "internal_note":
        return "added an internal note";
      case "satisfaction":
        return `rated the support ${e.to_value}/5`;
      default:
        return e.event_type;
    }
  };

  if (events.length === 0) return <p className="text-sm text-muted">No activity yet.</p>;

  return (
    <ol className="space-y-2.5">
      {events.map((e) => (
        <li key={e.id} className="text-xs leading-relaxed">
          <span className="font-medium text-foreground">{person(e.actor_id)}</span>{" "}
          <span className="text-muted">{describe(e)}</span>
          <span className="block text-[11px] text-muted">
            <LocalTime iso={e.created_at} relative />
          </span>
        </li>
      ))}
    </ol>
  );
}
