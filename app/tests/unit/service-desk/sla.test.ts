import { describe, expect, it } from "vitest";
import { describeClock, formatDuration, getSlaSnapshot, type SlaTicketFields } from "@/lib/service-desk/sla";

const now = new Date("2026-10-15T12:00:00Z");
const at = (minutesFromNow: number) => new Date(now.getTime() + minutesFromNow * 60000).toISOString();

function ticket(overrides: Partial<SlaTicketFields> = {}): SlaTicketFields {
  return {
    status: "open",
    first_response_due_at: at(240),
    resolution_due_at: at(1440),
    first_responded_at: null,
    resolved_at: null,
    sla_paused_at: null,
    ...overrides,
  };
}

describe("getSlaSnapshot", () => {
  it("is on track when both clocks have room", () => {
    const s = getSlaSnapshot(ticket(), now);
    expect(s.firstResponse.state).toBe("on_track");
    expect(s.firstResponse.minutesRemaining).toBe(240);
    expect(s.overall).toBe("on_track");
  });

  it("flags due soon inside the 2h window", () => {
    expect(getSlaSnapshot(ticket({ first_response_due_at: at(90) }), now).overall).toBe("due_soon");
  });

  it("reports a breach with minutes overdue", () => {
    const s = getSlaSnapshot(ticket({ first_response_due_at: at(-30) }), now);
    expect(s.overall).toBe("breached");
    expect(s.firstResponse.minutesRemaining).toBe(-30);
    expect(describeClock(s.firstResponse)).toBe("Overdue 30m");
  });

  it("treats a timely first response as met and lets resolution drive the badge", () => {
    const s = getSlaSnapshot(ticket({ first_responded_at: at(-10), first_response_due_at: at(60) }), now);
    expect(s.firstResponse.state).toBe("met");
    expect(s.overall).toBe("on_track");
  });

  it("keeps a late first response as breached even after replying", () => {
    const s = getSlaSnapshot(ticket({ first_response_due_at: at(-60), first_responded_at: at(-5) }), now);
    expect(s.firstResponse.state).toBe("breached");
    expect(s.overall).toBe("breached");
  });

  it("freezes the clock at the pause point while waiting on the client", () => {
    const s = getSlaSnapshot(
      ticket({ status: "pending_client", sla_paused_at: at(-600), first_responded_at: at(-700), resolution_due_at: at(-100) }),
      now
    );
    // Paused 600m ago with 500m left at that moment: still paused, not breached.
    expect(s.resolution.state).toBe("paused");
    expect(s.resolution.minutesRemaining).toBe(500);
    expect(s.overall).toBe("paused");
  });

  it("keeps a late first response visible after an on-time resolution", () => {
    const s = getSlaSnapshot(
      ticket({ status: "resolved", first_responded_at: at(-40), resolved_at: at(-5), first_response_due_at: at(-50) }),
      now
    );
    expect(s.firstResponse.state).toBe("breached");
    expect(s.resolution.state).toBe("met");
    expect(s.overall).toBe("breached");
  });

  it("is met overall when every target was hit", () => {
    const s = getSlaSnapshot(
      ticket({ status: "closed", first_responded_at: at(-100), first_response_due_at: at(-50), resolved_at: at(-5) }),
      now
    );
    expect(s.overall).toBe("met");
  });

  it("has no SLA when no targets exist", () => {
    expect(getSlaSnapshot(ticket({ first_response_due_at: null, resolution_due_at: null }), now).overall).toBe("none");
  });
});

describe("formatDuration", () => {
  it.each([
    [45, "45m"],
    [60, "1h"],
    [200, "3h 20m"],
    [1440, "1d"],
    [3120, "2d 4h"],
    [-75, "1h 15m"],
  ])("%i minutes → %s", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});
