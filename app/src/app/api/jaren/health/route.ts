import { authorize, checkMutationOrigin } from "@/lib/jaren/access-policy";
import { requireCpsmSession } from "@/lib/jaren/session";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const model = process.env.AI_MODEL ?? "gpt-5";

function statusMessage(status: number, code?: string) {
  if (status === 401) return "OpenAI rejected the API key.";
  if (status === 403) return "This API key does not have access to the selected model.";
  if (status === 404) return "The selected model is not available to this OpenAI project.";
  if (code === "insufficient_quota" || code === "billing_hard_limit_reached") {
    return "OpenAI API billing or credits are blocking generation.";
  }
  if (status === 429) return "OpenAI quota or rate limits are blocking generation.";
  if (status >= 500) return "OpenAI is temporarily unavailable.";
  return `OpenAI returned status ${status}.`;
}

export async function POST(request: Request) {
  const access = await requireCpsmSession();
  if (access instanceof Response) return access;
  const denied = authorize(access, "health", access.tenantId);
  if (denied) return denied;
  const originDenied = checkMutationOrigin(request, process.env.NEXT_PUBLIC_APP_URL);
  if (originDenied) return originDenied;
  const apiKey = process.env.OPENAI_API_KEY;
  const checkedAt = new Date().toISOString();
  const host = new URL(request.url).host;

  if (!apiKey) {
    return Response.json(
      {
        overall: "blocked",
        agentEndpoint: "online",
        credential: "missing",
        model,
        modelStatus: "not_checked",
        host,
        checkedAt,
        message: "OPENAI_API_KEY is not configured.",
      },
      { headers: { "cache-control": "no-store" } }
    );
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: "Reply with exactly: OK",
          max_output_tokens: 32,
          reasoning: { effort: "minimal" },
        }),
        signal: AbortSignal.timeout(10_000),
      }
    );

    const responseBody = (await response.json().catch(() => null)) as
      | { error?: { code?: string } }
      | null;
    const errorCode = responseBody?.error?.code;

    const ready = response.ok;
    return Response.json(
      {
        overall: ready ? "ready" : "blocked",
        agentEndpoint: "online",
        credential: response.status === 401 ? "rejected" : "configured",
        model,
        modelStatus: ready ? "available" : "unavailable",
        host,
        checkedAt,
        message: ready
          ? "Jaren can generate responses with the selected OpenAI model."
          : statusMessage(response.status, errorCode),
      },
      { headers: { "cache-control": "no-store" } }
    );
  } catch {
    return Response.json(
      {
        overall: "blocked",
        agentEndpoint: "online",
        credential: "configured",
        model,
        modelStatus: "unreachable",
        host,
        checkedAt,
        message: "The site could not reach OpenAI.",
      },
      { headers: { "cache-control": "no-store" } }
    );
  }
}
