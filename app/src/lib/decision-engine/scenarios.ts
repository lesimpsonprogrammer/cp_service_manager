import { z } from "zod";

const positive = z.number().finite().positive().max(1_000_000);
const task = z.object({ id: z.string().trim().min(1).max(80), duration: positive, arrival: z.number().finite().min(0).max(1_000_000).default(0) }).strict();
export const simulationSchema = z.object({
  tasks: z.array(task).min(1).max(200),
  capacity: z.number().int().min(1).max(100),
  cost_per_time: z.number().finite().min(0).max(1_000_000),
}).strict().refine(s => new Set(s.tasks.map(t => t.id)).size === s.tasks.length, "Task IDs must be unique.");
export const riskSchema = z.object({
  mean: positive, standard_deviation: positive, deadline: positive,
  samples: z.number().int().min(100).max(10_000), seed: z.number().int().min(0).max(2_147_483_647),
}).strict();
export const optimizationSchema = z.object({
  costs: z.array(z.array(z.number().int().min(-1_000_000).max(1_000_000)).min(1).max(30)).min(1).max(30),
}).strict().refine(s => s.costs.every(row => row.length === s.costs[0]!.length), "Use the same number of costs in each row.")
  .refine(s => s.costs.length >= s.costs[0]!.length, "Provide at least one worker per task.");
const base = { requestId: z.string().uuid(), name: z.string().trim().min(1).max(120) };
export const decisionSubmissionSchema = z.discriminatedUnion("engine", [
  z.object({ ...base, engine: z.literal("simulation"), scenario: simulationSchema }).strict(),
  z.object({ ...base, engine: z.literal("risk"), scenario: riskSchema }).strict(),
  z.object({ ...base, engine: z.literal("optimization"), scenario: optimizationSchema }).strict(),
  z.object({ ...base, engine: z.literal("combined"), scenario: z.object({ simulation: simulationSchema, risk: riskSchema, optimization: optimizationSchema }).strict() }).strict(),
]);
export type DecisionSubmission = z.infer<typeof decisionSubmissionSchema>;
export type RunEngine = DecisionSubmission["engine"];
export const decisionResponseSchema = z.object({
  runId: z.string().uuid(), status: z.enum(["completed", "partial", "failed"]),
  engine: z.enum(["simulation", "risk", "optimization", "combined"]),
  result: z.record(z.unknown()), warnings: z.array(z.string().max(1000)).max(30).optional(),
  metrics: z.record(z.number().finite()).optional(),
});
export type DecisionResponse = z.infer<typeof decisionResponseSchema>;
export type SavedDecisionRun = {
  id: string; name: string; engine: RunEngine; status: "queued" | "running" | "completed" | "partial" | "failed";
  scenario: Record<string, unknown>; response: DecisionResponse | null; error: string | null;
  created_at: string; finished_at: string | null;
}
