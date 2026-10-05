import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { getDecisionEngineHealth } from "@/lib/decision-engine/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import DecisionWorkbench from "./DecisionWorkbench";

const ADMIN_ROLES = new Set(["owner", "admin"]);

const ENGINE_META = {
  simulation: {
    title: "Deterministic Simulation",
    implementation: "SimPy",
    description: "Independent tasks sharing a capacity pool, FIFO queue timing, and busy-time costs.",
  },
  risk: {
    title: "Probabilistic Risk",
    implementation: "PyMC",
    description: "Lognormal duration sampling from a supplied mean and deviation, completion ranges, and probability of delay.",
  },
  optimization: {
    title: "Optimization",
    implementation: "OR-Tools / CP-SAT",
    description: "Minimum-cost worker-to-task assignment, with one worker per task and at most one task per worker.",
  },
} as const;

const STATUS_TONE = {
  up: "success",
  degraded: "warning",
  down: "danger",
  not_configured: "neutral",
} as const;

export default async function DecisionCenterPage() {
  const org = await getCurrentOrg();
  if (!org || !ADMIN_ROLES.has(org.role)) redirect("/dashboard");

  const health = await getDecisionEngineHealth();
  const states = new Map(health.engines.map((engine) => [engine.name, engine]));

  return (
    <div>
      <PageHeader
        title="Decision Center"
        description="CPSM computational decision layer for simulation, risk modeling, and optimization. Jaren interprets engine results; the engines remain the source of quantitative calculations."
        action={<Badge tone={STATUS_TONE[health.status]}>{health.status.replace("_", " ")}</Badge>}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {(Object.keys(ENGINE_META) as Array<keyof typeof ENGINE_META>).map((key) => {
          const meta = ENGINE_META[key];
          const state = states.get(key);
          const available = state?.available ?? false;
          return (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{meta.title}</CardTitle>
                  <Badge tone={available ? "success" : "neutral"}>{available ? "Ready" : "Pending"}</Badge>
                </div>
                <CardDescription>{meta.implementation}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted">{meta.description}</p>
                {state?.detail && <p className="mt-3 text-xs text-muted">{state.detail}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DecisionWorkbench ready={health.status === "up"} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Decision flow</CardTitle>
            <CardDescription>What the current Decision Engine supports.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-muted">
              <li><strong className="text-foreground">1. Inputs</strong> are entered and validated for the selected engine.</li>
              <li><strong className="text-foreground">2. Computation</strong> runs through CPSM’s private service connection.</li>
              <li><strong className="text-foreground">3. Combined mode</strong> executes independent simulation, risk, and optimization sections; results are not automatically fed between engines.</li>
              <li><strong className="text-foreground">4. History</strong> retains inputs and results for organization administrators.</li>
              <li><strong className="text-foreground">5. Review</strong> supports human decisions; no client actions are performed automatically. Custom constraints and Jaren interpretation are not part of this run interface.</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service connection</CardTitle>
            <CardDescription>Private server-to-server Decision Engine connection.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted">
            <p>{health.detail}</p>
            {health.version && <p><strong className="text-foreground">Version:</strong> {health.version}</p>}
            {typeof health.latencyMs === "number" && <p><strong className="text-foreground">Health latency:</strong> {health.latencyMs}ms</p>}
            <p className="text-xs">Engine URL and API credentials are server-only environment variables and are never rendered into the browser.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
