/**
 * Built-in Decision Engine: the same three computations as the Python
 * service (decision-engine/main.py), run inside CPSM. Used only when
 * DECISION_ENGINE_MODE=builtin; otherwise CPSM calls the external service.
 */
import { optimizationSchema, riskSchema, simulationSchema } from "./scenarios";
import type { DecisionEngineHealth, DecisionEngineName, DecisionRunRequest, DecisionRunResponse } from "./client";

export const BUILTIN_VERSION = "builtin-1.0.0";

const IMPLEMENTATIONS: Record<DecisionEngineName, string> = {
  simulation: "Built-in FIFO queue simulation",
  risk: "Built-in lognormal sampling",
  optimization: "Built-in Hungarian assignment",
};

export function getBuiltinHealth(): DecisionEngineHealth {
  return {
    status: "up",
    version: BUILTIN_VERSION,
    latencyMs: 0,
    engines: (Object.keys(IMPLEMENTATIONS) as DecisionEngineName[]).map(name => ({
      name,
      available: true,
      implementation: IMPLEMENTATIONS[name],
    })),
    detail: "All three computational engines run inside CPSM.",
  };
}

function parse<T>(schema: { safeParse(data: unknown): { success: true; data: T } | { success: false; error: { issues: { message: string }[] } } }, data: unknown): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Scenario does not match the documented schema.");
  return parsed.data;
}

/** First-come, first-served tasks sharing a capacity pool. */
export function simulate(data: unknown) {
  const scenario = parse(simulationSchema, data);
  // Serve tasks in arrival order (ties keep input order); each takes the earliest free slot.
  const order = scenario.tasks.map((task, index) => ({ task, index }))
    .sort((a, b) => a.task.arrival - b.task.arrival || a.index - b.index);
  const freeAt: number[] = Array.from({ length: scenario.capacity }, () => 0);
  const records = order.map(({ task }, position) => {
    let slot = 0;
    for (let i = 1; i < freeAt.length; i++) if (freeAt[i]! < freeAt[slot]!) slot = i;
    const start = Math.max(task.arrival, freeAt[slot]!);
    const finish = start + task.duration;
    freeAt[slot] = finish;
    return { id: task.id, start, finish, wait: start - task.arrival, position };
  });
  // Report tasks in the order they finish, as the Python service does.
  records.sort((a, b) => a.finish - b.finish || a.position - b.position);
  return {
    tasks: records.map(({ id, start, finish, wait }) => ({ id, start, finish, wait })),
    completion_time: Math.max(...records.map(r => r.finish)),
    busy_time_cost: scenario.tasks.reduce((sum, t) => sum + t.duration, 0) * scenario.cost_per_time,
  };
}

/** Deterministic pseudo-random numbers in [0, 1) from a 32-bit seed (mulberry32). */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Linear-interpolated quantile of sorted values (NumPy's default method). */
function quantile(sorted: number[], p: number): number {
  const h = (sorted.length - 1) * p;
  const lo = Math.floor(h);
  const hi = Math.min(lo + 1, sorted.length - 1);
  return sorted[lo]! + (h - lo) * (sorted[hi]! - sorted[lo]!);
}

/** Lognormal duration risk from a supplied mean and standard deviation. */
export function risk(data: unknown) {
  const scenario = parse(riskSchema, data);
  // Lognormal parameters preserve the caller's arithmetic mean and standard deviation.
  const sigma = Math.sqrt(Math.log1p((scenario.standard_deviation / scenario.mean) ** 2));
  const mu = Math.log(scenario.mean) - (sigma * sigma) / 2;
  const random = seededRandom(scenario.seed);
  const values: number[] = [];
  while (values.length < scenario.samples) {
    // Box-Muller: two uniforms give two independent standard normals.
    const u1 = 1 - random();
    const u2 = random();
    const radius = Math.sqrt(-2 * Math.log(u1));
    values.push(Math.exp(mu + sigma * radius * Math.cos(2 * Math.PI * u2)));
    if (values.length < scenario.samples) values.push(Math.exp(mu + sigma * radius * Math.sin(2 * Math.PI * u2)));
  }
  const sorted = [...values].sort((a, b) => a - b);
  return {
    mean: values.reduce((sum, v) => sum + v, 0) / values.length,
    p50: quantile(sorted, 0.5),
    p95: quantile(sorted, 0.95),
    probability_of_delay: values.filter(v => v > scenario.deadline).length / values.length,
    samples: scenario.samples,
    seed: scenario.seed,
    assumption: "Lognormal duration from supplied mean and deviation; no posterior fitting.",
  };
}

/** Minimum-cost assignment: every task gets exactly one distinct worker. */
export function optimize(data: unknown) {
  const { costs } = parse(optimizationSchema, data);
  const workers = costs.length;
  const tasks = costs[0]!.length;
  // Hungarian algorithm with tasks as rows (1-indexed) and workers as columns; tasks <= workers.
  const u = new Array<number>(tasks + 1).fill(0);
  const v = new Array<number>(workers + 1).fill(0);
  const owner = new Array<number>(workers + 1).fill(0);
  const way = new Array<number>(workers + 1).fill(0);
  for (let row = 1; row <= tasks; row++) {
    owner[0] = row;
    let col = 0;
    const minv = new Array<number>(workers + 1).fill(Infinity);
    const used = new Array<boolean>(workers + 1).fill(false);
    do {
      used[col] = true;
      const current = owner[col]!;
      let delta = Infinity;
      let next = 0;
      for (let j = 1; j <= workers; j++) {
        if (used[j]) continue;
        const reduced = costs[j - 1]![current - 1]! - u[current]! - v[j]!;
        if (reduced < minv[j]!) { minv[j] = reduced; way[j] = col; }
        if (minv[j]! < delta) { delta = minv[j]!; next = j; }
      }
      for (let j = 0; j <= workers; j++) {
        if (used[j]) { u[owner[j]!]! += delta; v[j]! -= delta; } else minv[j]! -= delta;
      }
      col = next;
    } while (owner[col] !== 0);
    do { const prev = way[col]!; owner[col] = owner[prev]!; col = prev; } while (col !== 0);
  }
  const assignments: { worker: number; task: number; cost: number }[] = [];
  for (let j = 1; j <= workers; j++) {
    if (owner[j]) assignments.push({ worker: j - 1, task: owner[j]! - 1, cost: costs[j - 1]![owner[j]! - 1]! });
  }
  return {
    assignments,
    total_cost: assignments.reduce((sum, a) => sum + a.cost, 0),
    optimal: true,
  };
}

const ENGINES = { simulation: simulate, risk, optimization: optimize } as const;

export async function runBuiltinDecision(request: DecisionRunRequest): Promise<DecisionRunResponse> {
  const started = performance.now();
  if (request.objective || request.constraints) {
    throw new Error("This version supports only the documented built-in objectives and constraints.");
  }
  let result: Record<string, unknown>;
  if (request.engine === "combined") {
    const sections = Object.keys(request.scenario ?? {}).sort().join(",");
    if (sections !== "optimization,risk,simulation") {
      throw new Error("Combined scenarios require simulation, risk, and optimization sections.");
    }
    result = {
      simulation: simulate(request.scenario.simulation),
      risk: risk(request.scenario.risk),
      optimization: optimize(request.scenario.optimization),
    };
  } else if (request.engine in ENGINES) {
    result = ENGINES[request.engine](request.scenario);
  } else {
    throw new Error("Unknown decision engine.");
  }
  return {
    runId: crypto.randomUUID(),
    status: "completed",
    engine: request.engine,
    result,
    warnings: ["risk", "combined"].includes(request.engine) ? ["Risk estimates depend on supplied assumptions."] : [],
    metrics: { durationMs: performance.now() - started },
  };
}
