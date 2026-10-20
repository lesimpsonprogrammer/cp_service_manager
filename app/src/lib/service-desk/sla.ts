import type { TicketStatus } from "@/types/database";
import { DONE_STATUSES, DUE_SOON_MINUTES, PAUSED_STATUSES } from "./constants";

export type SlaClockState = "met" | "breached" | "due_soon" | "on_track" | "paused" | "none";

export interface SlaClock {
  state: SlaClockState;
  dueAt: string | null;
  /** Minutes until due (negative once overdue). Null when not applicable. */
  minutesRemaining: number | null;
}

export interface SlaTicketFields {
  status: TicketStatus;
  first_response_due_at: string | null;
  resolution_due_at: string | null;
  first_responded_at: string | null;
  resolved_at: string | null;
  sla_paused_at: string | null;
}

export interface SlaSnapshot {
  firstResponse: SlaClock;
  resolution: SlaClock;
  /** Worst of the two running clocks — what the queue badge shows. */
  overall: SlaClockState;
}

function minutesBetween(fromMs: number, toIso: string): number {
  return Math.round((new Date(toIso).getTime() - fromMs) / 60000);
}

function clock(dueAt: string | null, completedAt: string | null, paused: boolean, pausedAt: string | null, nowMs: number): SlaClock {
  if (!dueAt) return { state: "none", dueAt: null, minutesRemaining: null };

  if (completedAt) {
    const met = new Date(completedAt).getTime() <= new Date(dueAt).getTime();
    return { state: met ? "met" : "breached", dueAt, minutesRemaining: null };
  }

  // While paused the clock is frozen at the moment it stopped; the trigger
  // pushes the due date out by the paused time when it resumes.
  const referenceMs = paused && pausedAt ? new Date(pausedAt).getTime() : nowMs;
  const remaining = minutesBetween(referenceMs, dueAt);

  if (remaining < 0) return { state: "breached", dueAt, minutesRemaining: remaining };
  if (paused) return { state: "paused", dueAt, minutesRemaining: remaining };
  if (remaining <= DUE_SOON_MINUTES) return { state: "due_soon", dueAt, minutesRemaining: remaining };
  return { state: "on_track", dueAt, minutesRemaining: remaining };
}

const SEVERITY: Record<SlaClockState, number> = {
  breached: 5,
  due_soon: 4,
  on_track: 3,
  paused: 2,
  met: 1,
  none: 0,
};

export function getSlaSnapshot(ticket: SlaTicketFields, now: Date = new Date()): SlaSnapshot {
  const nowMs = now.getTime();
  const paused = PAUSED_STATUSES.includes(ticket.status);
  const done = DONE_STATUSES.includes(ticket.status);

  const firstResponse = clock(
    ticket.first_response_due_at,
    ticket.first_responded_at,
    paused,
    ticket.sla_paused_at,
    nowMs
  );

  const resolution = clock(
    ticket.resolution_due_at,
    done ? ticket.resolved_at ?? now.toISOString() : null,
    paused,
    ticket.sla_paused_at,
    nowMs
  );

  // Once a clock is finished (met) it no longer drives the badge, but a
  // breach always does.
  const running = [firstResponse, resolution].filter((c) => c.state !== "met" && c.state !== "none");
  const overall = running.length
    ? running.reduce((worst, c) => (SEVERITY[c.state] > SEVERITY[worst] ? c.state : worst), "none" as SlaClockState)
    : firstResponse.state === "breached" || resolution.state === "breached"
      ? "breached"
      : done
        ? "met"
        : "none";

  return { firstResponse, resolution, overall };
}

/** "3h 20m", "2d 4h", "45m" — for SLA badges and timers. */
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.abs(Math.round(totalMinutes));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return hours ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return mins ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
}

export function describeClock(c: SlaClock): string {
  switch (c.state) {
    case "met":
      return "Met";
    case "breached":
      return c.minutesRemaining !== null ? `Overdue ${formatDuration(c.minutesRemaining)}` : "Missed";
    case "paused":
      return c.minutesRemaining !== null ? `Paused · ${formatDuration(c.minutesRemaining)} left` : "Paused";
    case "due_soon":
    case "on_track":
      return c.minutesRemaining !== null ? `${formatDuration(c.minutesRemaining)} left` : "On track";
    default:
      return "—";
  }
}
