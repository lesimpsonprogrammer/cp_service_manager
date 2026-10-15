import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import {
  CLIENT_STATUS_LABELS,
  PRIORITY_LABELS,
  PRIORITY_TONES,
  STATUS_LABELS,
  STATUS_TONES,
  type Tone,
} from "@/lib/glass/constants";
import { describeClock, getSlaSnapshot, type SlaClockState, type SlaTicketFields } from "@/lib/glass/sla";
import type { TicketPriority, TicketStatus } from "@/types/database";

const DOT: Record<Tone, string> = {
  neutral: "bg-muted",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  brand: "bg-brand",
};

export function TicketStatusBadge({ status, audience = "staff" }: { status: TicketStatus; audience?: "staff" | "client" }) {
  const tone = STATUS_TONES[status];
  return (
    <Badge tone={tone} className="whitespace-nowrap">
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[tone])} />
      {audience === "client" ? CLIENT_STATUS_LABELS[status] : STATUS_LABELS[status]}
    </Badge>
  );
}

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <Badge tone={PRIORITY_TONES[priority]} className="whitespace-nowrap">
      {priority === "urgent" && <span aria-hidden="true">▲</span>}
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

const SLA_TONE: Record<SlaClockState, Tone> = {
  breached: "danger",
  due_soon: "warning",
  on_track: "success",
  paused: "neutral",
  met: "success",
  none: "neutral",
};

const SLA_LABEL: Record<SlaClockState, string> = {
  breached: "SLA breached",
  due_soon: "Due soon",
  on_track: "On track",
  paused: "SLA paused",
  met: "SLA met",
  none: "No SLA",
};

/** The single badge the queue shows: worst of first-response and resolution. */
export function SlaBadge({ ticket, now }: { ticket: SlaTicketFields; now?: Date }) {
  const snapshot = getSlaSnapshot(ticket, now);
  if (snapshot.overall === "none") return <span className="text-xs text-muted">—</span>;
  const driving =
    [snapshot.firstResponse, snapshot.resolution].find((c) => c.state === snapshot.overall) ?? snapshot.resolution;
  return (
    <Badge tone={SLA_TONE[snapshot.overall]} className="whitespace-nowrap" title={SLA_LABEL[snapshot.overall]}>
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[SLA_TONE[snapshot.overall]])} />
      {snapshot.overall === "met" ? "Met" : describeClock(driving)}
    </Badge>
  );
}

export function SlaClockRow({ label, clock }: { label: string; clock: ReturnType<typeof getSlaSnapshot>["firstResponse"] }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <Badge tone={SLA_TONE[clock.state]} className="whitespace-nowrap">
        {describeClock(clock)}
      </Badge>
    </div>
  );
}
