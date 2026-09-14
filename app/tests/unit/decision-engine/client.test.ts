import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDecisionEngineHealth,
  isDecisionEngineConfigured,
  runDecision,
} from "@/lib/decision-engine/client";

const ORIGINAL_ENV = { ...process.env };

describe("Decision Engine client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.DECISION_ENGINE_URL;
    delete process.env.DECISION_ENGINE_API_KEY;
    delete process.env.DECISION_ENGINE_TIMEOUT_MS;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("reports not configured without server credentials", async () => {
    expect(isDecisionEngineConfigured()).toBe(false);

    const health = await getDecisionEngineHealth();

    expect(health.status).toBe("not_configured");
    expect(health.engines).toEqual([
      { name: "simulation", available: false, implementation: "SimPy" },
      { name: "risk", available: false, implementation: "PyMC" },
      { name: "optimization", available: false, implementation: "OR-Tools / CP-SAT" },
    ]);
  });

  it("performs an authenticated server-side health check", async () => {
    process.env.DECISION_ENGINE_URL = "https://decision.internal/";
    process.env.DECISION_ENGINE_API_KEY = "test-secret";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "up",
          version: "0.1.0",
          engines: [
            { name: "simulation", available: true, implementation: "SimPy" },
            { name: "risk", available: true, implementation: "PyMC" },
            { name: "optimization", available: true, implementation: "OR-Tools / CP-SAT" },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const health = await getDecisionEngineHealth();

    expect(health.status).toBe("up");
    expect(health.version).toBe("0.1.0");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://decision.internal/health");
    expect(init.headers.authorization).toBe("Bearer test-secret");
  });

  it("refuses a decision run when the private service is not configured", async () => {
    await expect(
      runDecision({
        engine: "optimization",
        scenario: { resources: 3 },
      }),
    ).rejects.toThrow("Decision Engine is not configured");
  });
});
