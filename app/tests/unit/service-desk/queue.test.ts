import { describe, expect, it } from "vitest";
import { csvCell, parseQueueFilters, queueHref, sortRows, type QueueRow } from "@/lib/service-desk/queue";

const UUID = "3f2b8c1e-9a4d-4c2b-8e1f-0a1b2c3d4e5f";

describe("parseQueueFilters", () => {
  it("defaults to the open list view", () => {
    expect(parseQueueFilters({})).toMatchObject({ queue: "open", view: "list", sort: "activity", priority: null, clientId: null });
  });

  it("ignores unknown values and malformed ids", () => {
    const f = parseQueueFilters({ queue: "drop table", priority: "critical", client: "1 or 1=1", sort: "x" });
    expect(f).toMatchObject({ queue: "open", priority: null, clientId: null, sort: "activity" });
  });

  it("reads valid filters", () => {
    const f = parseQueueFilters({ queue: "breached", view: "board", priority: "urgent", client: UUID, q: "payroll, (q3)" });
    expect(f).toMatchObject({ queue: "breached", view: "board", priority: "urgent", clientId: UUID, q: "payroll q3" });
  });
});

describe("queueHref", () => {
  it("round-trips and omits defaults", () => {
    const f = parseQueueFilters({ queue: "mine", priority: "high" });
    expect(queueHref(f)).toBe("/tickets?queue=mine&priority=high");
    expect(queueHref(f, { queue: "open", priority: null })).toBe("/tickets");
    expect(queueHref(f, {}, "/tickets/export")).toBe("/tickets/export?queue=mine&priority=high");
  });
});

describe("sortRows", () => {
  const row = (id: string, priority: QueueRow["priority"], due: string | null, activity: string): QueueRow =>
    ({ id, priority, resolution_due_at: due, last_activity_at: activity, created_at: activity }) as QueueRow;
  const rows = [
    row("a", "low", "2026-10-16T00:00:00Z", "2026-10-15T10:00:00Z"),
    row("b", "urgent", "2026-10-17T00:00:00Z", "2026-10-15T09:00:00Z"),
    row("c", "normal", null, "2026-10-15T11:00:00Z"),
  ];

  it("sorts by priority, then due date", () => {
    expect(sortRows(rows, "priority").map((r) => r.id)).toEqual(["b", "c", "a"]);
  });
  it("sorts by SLA due with no-due last", () => {
    expect(sortRows(rows, "due").map((r) => r.id)).toEqual(["a", "b", "c"]);
  });
  it("defaults to latest activity", () => {
    expect(sortRows(rows, "activity").map((r) => r.id)).toEqual(["c", "a", "b"]);
  });
});

describe("csvCell", () => {
  it("quotes commas, quotes, and newlines", () => {
    expect(csvCell('He said "hi", then left')).toBe('"He said ""hi"", then left"');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
  });
  it("neutralizes spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK(\"http://x\")")).toBe('"\'=HYPERLINK(""http://x"")"');
    expect(csvCell("+1")).toBe("'+1");
  });
  it("handles empty values and arrays", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(["a", "b"])).toBe("a; b");
  });
});
