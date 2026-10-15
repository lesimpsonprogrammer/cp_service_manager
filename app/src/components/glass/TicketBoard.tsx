import Link from "next/link";
import { STATUS_LABELS } from "@/lib/glass/constants";
import type { TicketStatus } from "@/types/database";
import { TicketPriorityBadge } from "./TicketBadges";
import type { QueueTableRow } from "./TicketQueue";

const COLUMNS: TicketStatus[] = ["new", "open", "pending_client", "on_hold", "resolved", "closed"];

/** Read-only Kanban of the current queue, grouped by status. */
export function TicketBoard({ rows }: { rows: QueueTableRow[] }) {
  const columns = COLUMNS.filter((status) => status !== "closed" || rows.some((r) => r.status === "closed"));
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {columns.map((status) => {
        const items = rows.filter((r) => r.status === status);
        return (
          <section key={status} className="flex min-h-[8rem] flex-col rounded-lg border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <h3 className="text-sm font-semibold text-foreground">{STATUS_LABELS[status]}</h3>
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">{items.length}</span>
            </div>
            <div className="space-y-2 p-2">
              {items.length === 0 && <p className="px-2 py-4 text-center text-xs text-muted">Nothing here</p>}
              {items.map((row) => (
                <Link
                  key={row.id}
                  href={`/tickets/${row.id}`}
                  className="block rounded-md border border-border bg-canvas p-3 transition-colors hover:border-brand/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted">{row.ticketNumber}</span>
                    <TicketPriorityBadge priority={row.priority} />
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm font-medium text-foreground">{row.subject}</p>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
                    <span className="truncate">{row.assigneeName ?? "Unassigned"}</span>
                    {row.sla}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
