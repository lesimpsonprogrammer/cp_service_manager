"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";
import { bulkUpdateTickets, type GlassFormState } from "@/app/(dashboard)/tickets/actions";
import { PRIORITY_LABELS, STATUS_LABELS, TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/glass/constants";
import type { TicketPriority, TicketStatus } from "@/types/database";
import { TicketPriorityBadge, TicketStatusBadge } from "./TicketBadges";
import { LocalTime } from "./LocalTime";

export interface QueueTableRow {
  id: string;
  ticketNumber: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  clientName: string | null;
  assigneeName: string | null;
  requester: string | null;
  categoryName: string | null;
  tags: string[];
  lastActivityAt: string;
  /** Server-rendered SLA badge (computed against server time to avoid hydration drift). */
  sla: React.ReactNode;
}

export function TicketQueue({
  rows,
  members,
  canEdit,
}: {
  rows: QueueTableRow[];
  members: { userId: string; fullName: string }[];
  canEdit: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [state, formAction, pending] = useActionState(async (prev: GlassFormState, formData: FormData) => {
    const result = await bulkUpdateTickets(prev, formData);
    if (!result.error) setSelected(new Set());
    return result;
  }, { error: null } as GlassFormState);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-3">
      {canEdit && (
        <form
          action={formAction}
          className={cn(
            "flex flex-wrap items-end gap-2 rounded-card border border-border bg-surface p-3 transition-opacity",
            selected.size === 0 && "opacity-60"
          )}
          aria-label="Bulk update selected tickets"
        >
          {Array.from(selected).map((id) => (
            <input key={id} type="hidden" name="ticket_ids" value={id} />
          ))}
          <p className="w-full text-sm text-muted sm:mr-auto sm:w-auto sm:flex-1">
            {selected.size === 0 ? "Select tickets to update them together" : `${selected.size} selected`}
          </p>
          <div className="w-36">
            <Select name="bulk_status" defaultValue="" aria-label="Set status" className="h-8 text-xs">
              <option value="">Status…</option>
              {TICKET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-32">
            <Select name="bulk_priority" defaultValue="" aria-label="Set priority" className="h-8 text-xs">
              <option value="">Priority…</option>
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-40">
            <Select name="bulk_assignee" defaultValue="" aria-label="Set assignee" className="h-8 text-xs">
              <option value="">Assignee…</option>
              <option value="unassigned">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.fullName}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" size="sm" disabled={pending || selected.size === 0}>
            {pending ? "Applying…" : "Apply"}
          </Button>
          {(state.error || state.success) && (
            <p className={cn("w-full text-sm", state.error ? "text-danger" : "text-success")} role="status">
              {state.error ?? state.success}
            </p>
          )}
        </form>
      )}

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
              <tr>
                {canEdit && (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all tickets"
                      checked={allSelected}
                      onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))}
                      className="rounded border-border"
                    />
                  </th>
                )}
                <th className="px-4 py-3 font-medium">Ticket</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">SLA</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Assignee</th>
                <th className="px-4 py-3 font-medium">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className={cn("hover:bg-surface-2/60", selected.has(row.id) && "bg-brand/5")}>
                  {canEdit && (
                    <td className="px-4 py-3 align-top">
                      <input
                        type="checkbox"
                        aria-label={`Select ${row.ticketNumber}`}
                        checked={selected.has(row.id)}
                        onChange={() => toggle(row.id)}
                        className="rounded border-border"
                      />
                    </td>
                  )}
                  <td className="max-w-md px-4 py-3 align-top">
                    <Link href={`/tickets/${row.id}`} className="group block">
                      <span className="font-mono text-xs text-muted">{row.ticketNumber}</span>
                      <span className="block truncate font-medium text-foreground group-hover:text-brand">{row.subject}</span>
                      <span className="block truncate text-xs text-muted">
                        {[row.requester, row.categoryName].filter(Boolean).join(" · ") || "—"}
                        {row.tags.length > 0 && <span className="ml-1">{row.tags.map((t) => `#${t}`).join(" ")}</span>}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <TicketStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <TicketPriorityBadge priority={row.priority} />
                  </td>
                  <td className="px-4 py-3 align-top">{row.sla}</td>
                  <td className="px-4 py-3 align-top text-muted">{row.clientName ?? "Internal"}</td>
                  <td className="px-4 py-3 align-top">
                    {row.assigneeName ? (
                      <span className="text-foreground">{row.assigneeName}</span>
                    ) : (
                      <span className="text-warning">Unassigned</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-top text-muted">
                    <LocalTime iso={row.lastActivityAt} relative />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
