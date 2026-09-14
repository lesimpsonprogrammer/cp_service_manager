export type DecisionEngineName = "simulation" | "risk" | "optimization";

export type EngineState = {
  name: DecisionEngineName;
  available: boolean;
  implementation?: string;
  detail?: string;
};

export type DecisionEngineHealth = {
  status: "up" | "degraded" | "down" | "not_configured";
  version?: string;
  latencyMs?: number;
  engines: EngineState[];
  detail: string;
};

export type DecisionRunRequest = {
  engine: DecisionEngineName | "combined";
  scenario: Record<string, unknown>;
  objective?: Record<string, unknown>;
  constraints?: Record<string, unknown>[];
  metadata?: Record<string, unknown>;
};

export type DecisionRunResponse = {
  runId: string;
  status: "completed" | "partial" | "failed";
  engine: DecisionEngineName | "combined";
  result: Record<string, unknown>;
  warnings?: string[];
  metrics?: Record<string, number>;
};

const DEFAULT_TIMEOUT_MS = 15_000;

function getConfig() {
  return {
    url: process.env.DECISION_ENGINE_URL?.replace(/\/$/, ""),
    apiKey: process.env.DECISION_ENGINE_API_KEY,
    timeoutMs: Number(process.env.DECISION_ENGINE_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS),
  };
}

export function isDecisionEngineConfigured(): boolean {
  const { url, apiKey } = getConfig();
  return Boolean(url && apiKey);
}

function authHeaders(apiKey: string): HeadersInit {
  return {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
    "user-agent": "CPSM-Decision-Client/1.0",
  };
}

export async function getDecisionEngineHealth(): Promise<DecisionEngineHealth> {
  const { url, apiKey, timeoutMs } = getConfig();
  if (!url || !apiKey) {
    return {
      status: "not_configured",
      engines: [
        { name: "simulation", available: false, implementation: "SimPy" },
        { name: "risk", available: false, implementation: "PyMC" },
        { name: "optimization", available: false, implementation: "OR-Tools / CP-SAT" },
      ],
      detail: "Decision Engine service credentials are not configured yet.",
    };
  }

  const started = Date.now();
  try {
    const response = await fetch(`${url}/health`, {
      method: "GET",
      headers: authHeaders(apiKey),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const latencyMs = Date.now() - started;
    if (!response.ok) {
      return {
        status: response.status >= 500 ? "down" : "degraded",
        latencyMs,
        engines: [],
        detail: `Decision Engine health check returned HTTP ${response.status}.`,
      };
    }

    const payload = (await response.json()) as Partial<DecisionEngineHealth>;
    return {
      status: payload.status === "degraded" ? "degraded" : "up",
      version: payload.version,
      latencyMs,
      engines: Array.isArray(payload.engines) ? payload.engines : [],
      detail: payload.detail ?? `Decision Engine responded in ${latencyMs}ms.`,
    };
  } catch (error) {
    return {
      status: "down",
      latencyMs: Date.now() - started,
      engines: [],
      detail: error instanceof Error ? error.message : "Decision Engine health check failed.",
    };
  }
}

export async function runDecision(request: DecisionRunRequest): Promise<DecisionRunResponse> {
  const { url, apiKey, timeoutMs } = getConfig();
  if (!url || !apiKey) {
    throw new Error("Decision Engine is not configured.");
  }

  const response = await fetch(`${url}/v1/decisions/run`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify(request),
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Decision Engine request failed with HTTP ${response.status}${body ? `: ${body.slice(0, 300)}` : ""}`);
  }

  return (await response.json()) as DecisionRunResponse;
}
