import { authorize, checkMutationOrigin, readBoundedJson } from "@/lib/jaren/access-policy";
import { requireCpsmSession } from "@/lib/jaren/session";
import { createAgentUIStreamResponse } from "ai";
import { createClient } from "@/lib/supabase/server";

import { createJarenAgent, type EssentialSkill, type EnhancedSkill } from "@/lib/jaren/agent";

export const runtime = "nodejs";
export const maxDuration = 60;

function safeAgentError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("401") || message.includes("api key")) {
    return "OpenAI rejected Jaren's API key. Run the Jaren health check for the exact status.";
  }
  if (
    message.includes("insufficient_quota") ||
    message.includes("billing") ||
    message.includes("quota") ||
    message.includes("429")
  ) {
    return "OpenAI API billing, quota, or rate limits blocked this request. Run the Jaren health check.";
  }
  if (
    message.includes("model") ||
    message.includes("403") ||
    message.includes("404")
  ) {
    return "The selected OpenAI model is not available to this API project. Run the Jaren health check.";
  }

  return "Jaren could not complete the OpenAI request. Run the Jaren health check for the connection status.";
}

export async function POST(request: Request) {
  const access = await requireCpsmSession();
  if (access instanceof Response) return access;
  const denied = authorize(access, "chat", access.tenantId);
  if (denied) return denied;
  const originDenied = checkMutationOrigin(request, process.env.NEXT_PUBLIC_APP_URL);
  if (originDenied) return originDenied;
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      {
        error:
          "Jaren is ready, but its private OpenAI credential has not been connected yet.",
      },
      { status: 503 }
    );
  }

  let body: { messages?: unknown[] };
  try {
    const parsed = await readBoundedJson(request);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid-json");
    body = parsed as { messages?: unknown[] };
  } catch (error) {
    const code = error instanceof Error ? error.message : "invalid-json";
    return Response.json({ error: "Invalid or oversized JSON request." }, {
      status: code === "request-too-large" ? 413 : code === "unsupported-content-type" ? 415 : 400,
    });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 100) {
    return Response.json({ error: "A messages array is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: agentSettings } = await supabase
    .from("jaren_agent_settings")
    .select("essential_skills, enhanced_skills")
    .eq("org_id", access.tenantId)
    .maybeSingle();

  const agent = createJarenAgent(
    agentSettings?.essential_skills as EssentialSkill[] | undefined,
    agentSettings?.enhanced_skills as EnhancedSkill[] | undefined,
  );

  return createAgentUIStreamResponse({
    agent,
    uiMessages: body.messages,
    abortSignal: request.signal,
    timeout: { totalMs: 55_000 },
    onError: safeAgentError,
  });
}
