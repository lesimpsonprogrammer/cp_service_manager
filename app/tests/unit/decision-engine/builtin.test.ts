import { afterEach, describe, expect, it, vi } from "vitest";
import { optimize, risk, runBuiltinDecision, simulate } from "@/lib/decision-engine/builtin";
import { getDecisionEngineHealth, isDecisionEngineConfigured, runDecision } from "@/lib/decision-engine/client";
import { decisionResponseSchema } from "@/lib/decision-engine/scenarios";

const ORIGINAL_ENV = { ...process.env };
afterEach(() => { process.env = { ...ORIGINAL_ENV }; vi.unstubAllGlobals(); });

// Ported from decision-engine/tests/test_service.py so both engines answer the same.
describe("Built-in Decision Engine", () => {
  it("queues tasks behind a single slot", () => {
    const result = simulate({ tasks: [{ id: "a", duration: 3 }, { id: "b", duration: 2 }], capacity: 1, cost_per_time: 10 });
    expect(result.completion_time).toBe(5);
    expect(result.tasks[1]!.wait).toBe(3);
    expect(result.busy_time_cost).toBe(50);
  });

  it("runs tasks in parallel when capacity allows", () => {
    expect(simulate({ tasks: [{ id: "a", duration: 3 }, { id: "b", duration: 2 }], capacity: 2, cost_per_time: 0 }).completion_time).toBe(3);
  });

  it("respects arrivals and reports tasks in finish order", () => {
    const result = simulate({
      tasks: [{ id: "late", duration: 1, arrival: 10 }, { id: "long", duration: 4 }, { id: "short", duration: 1, arrival: 1 }],
      capacity: 1, cost_per_time: 0,
    });
    expect(result.tasks).toEqual([
      { id: "long", start: 0, finish: 4, wait: 0 },
      { id: "short", start: 4, finish: 5, wait: 3 },
      { id: "late", start: 10, finish: 11, wait: 0 },
    ]);
    expect(result.completion_time).toBe(11);
  });

  it("gives reproducible risk estimates near the supplied mean", () => {
    const scenario = { mean: 10, standard_deviation: 2, deadline: 10, samples: 2000, seed: 42 };
    const a = risk(scenario);
    expect(risk(scenario)).toEqual(a);
    expect(a.mean).toBeGreaterThan(9);
    expect(a.mean).toBeLessThan(11);
    expect(a.probability_of_delay).toBeGreaterThan(0);
    expect(a.probability_of_delay).toBeLessThan(1);
    expect(a.p50).toBeLessThan(a.p95);
    expect(risk({ ...scenario, seed: 7 })).not.toEqual(a);
  });

  it("finds the optimal assignment", () => {
    const result = optimize({ costs: [[10, 1], [2, 10]] });
    expect(result.total_cost).toBe(3);
    expect(result.optimal).toBe(true);
    expect(result.assignments).toEqual([{ worker: 0, task: 1, cost: 1 }, { worker: 1, task: 0, cost: 2 }]);
  });

  it("matches brute force on random matrices, including spare workers and negative costs", () => {
    let seed = 1;
    const next = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed; };
    const best = (costs: number[][], task = 0, used = new Set<number>()): number => {
      if (task === costs[0]!.length) return 0;
      let min = Infinity;
      for (let w = 0; w < costs.length; w++) {
        if (used.has(w)) continue;
        used.add(w);
        min = Math.min(min, costs[w]![task]! + best(costs, task + 1, used));
        used.delete(w);
      }
      return min;
    };
    for (let trial = 0; trial < 200; trial++) {
      const tasks = 1 + (next() % 5);
      const workers = tasks + (next() % 3);
      const costs = Array.from({ length: workers }, () => Array.from({ length: tasks }, () => (next() % 41) - 20));
      const result = optimize({ costs });
      expect(result.total_cost).toBe(best(costs));
      expect(result.assignments).toHaveLength(tasks);
      expect(new Set(result.assignments.map(a => a.task)).size).toBe(tasks);
      expect(new Set(result.assignments.map(a => a.worker)).size).toBe(tasks);
    }
  });

  it("rejects bad scenarios", async () => {
    for (const [engine, scenario] of [
      ["simulation", { tasks: [], capacity: 1, cost_per_time: 0 }],
      ["risk", { mean: 10, standard_deviation: 0, deadline: 10, samples: 100, seed: 1 }],
      ["optimization", { costs: [[1, 2], [3]] }],
      ["optimization", { costs: [[1, 2]] }],
      ["combined", {}],
    ] as const) {
      await expect(runBuiltinDecision({ engine, scenario })).rejects.toThrow();
    }
    await expect(runBuiltinDecision({
      engine: "simulation", scenario: { tasks: [{ id: "a", duration: 1 }], capacity: 1, cost_per_time: 0 }, constraints: [{ unknown: 1 }],
    })).rejects.toThrow("objectives and constraints");
  });

  it("runs combined scenarios in the response shape CPSM stores", async () => {
    const response = await runBuiltinDecision({
      engine: "combined",
      scenario: {
        simulation: { tasks: [{ id: "a", duration: 1 }], capacity: 1, cost_per_time: 0 },
        risk: { mean: 10, standard_deviation: 2, deadline: 12, samples: 100, seed: 42 },
        optimization: { costs: [[1]] },
      },
    });
    expect(decisionResponseSchema.parse(response).status).toBe("completed");
    expect(Object.keys(response.result).sort()).toEqual(["optimization", "risk", "simulation"]);
    expect(response.warnings).toEqual(["Risk estimates depend on supplied assumptions."]);
  });
});

describe("Decision Engine mode switch", () => {
  it("uses the built-in engine only when DECISION_ENGINE_MODE=builtin", async () => {
    delete process.env.DECISION_ENGINE_URL;
    delete process.env.DECISION_ENGINE_API_KEY;
    delete process.env.DECISION_ENGINE_MODE;
    expect(isDecisionEngineConfigured()).toBe(false);

    process.env.DECISION_ENGINE_MODE = "builtin";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(isDecisionEngineConfigured()).toBe(true);
    expect((await getDecisionEngineHealth()).status).toBe("up");
    const response = await runDecision({ engine: "optimization", scenario: { costs: [[10, 1], [2, 10]] } });
    expect(response.result.total_cost).toBe(3);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
