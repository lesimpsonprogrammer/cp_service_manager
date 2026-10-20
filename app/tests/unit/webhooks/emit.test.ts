import { beforeEach, describe, expect, it, vi } from "vitest";

const dispatchEvent = vi.fn();
const contains = vi.fn();

vi.mock("next/server", () => ({
  // Outside a request, after() throws; emit must fall back to running immediately.
  after: () => {
    throw new Error("outside request scope");
  },
}));
vi.mock("@/lib/webhooks/dispatch", () => ({ dispatchEvent: (...args: unknown[]) => dispatchEvent(...args) }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ contains: (...args: unknown[]) => contains(...args) }) }) }),
    }),
  }),
}));

import { emitEvent, emitSystemEvent, reportEmailFailure, reportJob } from "@/lib/webhooks/emit";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  dispatchEvent.mockReset().mockResolvedValue(undefined);
  contains.mockReset().mockResolvedValue({ data: [{ org_id: "org-a" }, { org_id: "org-b" }, { org_id: "org-a" }] });
});

describe("emitEvent", () => {
  it("dispatches to the workspace with the service-role client", async () => {
    emitEvent("org-a", "security.api_key.created", { id: "k1" });
    await flush();
    expect(dispatchEvent).toHaveBeenCalledWith(expect.anything(), "org-a", "security.api_key.created", { id: "k1" });
  });

  it("never throws into the caller when delivery fails", async () => {
    dispatchEvent.mockRejectedValue(new Error("endpoint down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => emitEvent("org-a", "x", {})).not.toThrow();
    await flush();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("emitSystemEvent", () => {
  it("fans out once per workspace subscribed to the event", async () => {
    emitSystemEvent("system.job.failed", { job: "x" });
    await flush();
    expect(contains).toHaveBeenCalledWith("events", ["system.job.failed"]);
    expect(dispatchEvent.mock.calls.map((c) => c[1]).sort()).toEqual(["org-a", "org-b"]);
  });
});

describe("reportJob", () => {
  it("reports success and returns the job's result", async () => {
    await expect(reportJob("nightly", async () => 42)).resolves.toBe(42);
    await flush();
    expect(dispatchEvent).toHaveBeenCalledWith(expect.anything(), "org-a", "system.job.succeeded", { job: "nightly" });
  });

  it("reports failure and rethrows", async () => {
    await expect(reportJob("nightly", async () => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    await flush();
    expect(dispatchEvent).toHaveBeenCalledWith(expect.anything(), "org-a", "system.job.failed", { job: "nightly", error: "boom" });
  });

  it("treats returned errors as a failure when told how to read them", async () => {
    await reportJob("upkeep", async () => ({ errors: ["a", "b"] }), (r) => (r.errors.length ? r.errors.join("; ") : null));
    await flush();
    expect(dispatchEvent).toHaveBeenCalledWith(expect.anything(), "org-a", "system.job.failed", { job: "upkeep", error: "a; b" });
  });
});

describe("reportEmailFailure", () => {
  it("sends the email kind and a trimmed message", async () => {
    reportEmailFailure("invoice", { message: "x".repeat(900) });
    await flush();
    const payload = dispatchEvent.mock.calls[0]![3] as { kind: string; error: string };
    expect(payload.kind).toBe("invoice");
    expect(payload.error).toHaveLength(500);
  });
});
