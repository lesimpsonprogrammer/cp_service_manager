import { createClient } from "@/lib/supabase/server";

export type CheckStatus = "up" | "down" | "degraded" | "not_configured" | "unknown";

export type CheckResult = {
  name: string;
  status: CheckStatus;
  detail: string;
  latencyMs?: number;
  href?: string;
};

async function pingUrl(name: string, url: string): Promise<CheckResult> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
      headers: { "user-agent": "CPSM-Status-Page" },
    });
    const latencyMs = Date.now() - started;
    return {
      name,
      status: res.ok ? "up" : "degraded",
      detail: `HTTP ${res.status} in ${latencyMs}ms`,
      latencyMs,
      href: url,
    };
  } catch (error) {
    return {
      name,
      status: "down",
      detail: error instanceof Error ? error.message : "Request failed",
      href: url,
    };
  }
}

export async function checkDomains(): Promise<CheckResult[]> {
  const domains = [
    ["app.cpservicemanager.com", "https://app.cpservicemanager.com"],
    ["cpservicemanager.com", "https://cpservicemanager.com"],
    ["app.momentumdatasolutions.com", "https://app.momentumdatasolutions.com"],
    ["momentumdatasolutions.com", "https://momentumdatasolutions.com"],
  ] as const;
  return Promise.all(domains.map(([name, url]) => pingUrl(name, url)));
}

export async function checkSupabase(): Promise<CheckResult> {
  const started = Date.now();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("organizations").select("id").limit(1);
    const latencyMs = Date.now() - started;
    if (error) return { name: "Supabase", status: "down", detail: error.message, latencyMs };
    return { name: "Supabase", status: "up", detail: `Query round-trip in ${latencyMs}ms`, latencyMs };
  } catch (error) {
    return {
      name: "Supabase",
      status: "down",
      detail: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

export function checkJarenConfig(): CheckResult {
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  const model = process.env.AI_MODEL ?? "gpt-5";
  return {
    name: "Jaren CP",
    status: hasKey ? "up" : "not_configured",
    detail: hasKey
      ? `Credential configured, model: ${model}. Run the live health check on /jaren for a real OpenAI round-trip.`
      : "OPENAI_API_KEY is not set — chat will return 503.",
    href: "/jaren",
  };
}

export function getCodebaseInfo(): CheckResult {
  const sha = process.env.RAILWAY_GIT_COMMIT_SHA;
  const branch = process.env.RAILWAY_GIT_BRANCH;
  const message = process.env.RAILWAY_GIT_COMMIT_MESSAGE;
  if (!sha) {
    return {
      name: "Codebase",
      status: "unknown",
      detail: "No Railway git metadata found in this environment.",
      href: "https://github.com/lesimpsonprogrammer/cp_service_manager",
    };
  }
  return {
    name: "Codebase",
    status: "up",
    detail: `${branch ?? "unknown branch"} @ ${sha.slice(0, 7)}${message ? ` — ${message.split("\n")[0]}` : ""}`,
    href: `https://github.com/lesimpsonprogrammer/cp_service_manager/commit/${sha}`,
  };
}

export function getHostingInfo(): CheckResult {
  const service = process.env.RAILWAY_SERVICE_NAME;
  const environment = process.env.RAILWAY_ENVIRONMENT_NAME;
  const domain = process.env.RAILWAY_PUBLIC_DOMAIN;
  if (!service) {
    return {
      name: "Hosting (Railway)",
      status: "unknown",
      detail: "Not running on Railway, or Railway's environment variables aren't present.",
    };
  }
  return {
    name: "Hosting (Railway)",
    status: "up",
    detail: `${service} · ${environment ?? "unknown env"}${domain ? ` · ${domain}` : ""}`,
  };
}

/**
 * Cards for services this app has no API credentials for yet. Each links out
 * to the real dashboard rather than faking a status; add the noted env var
 * to move one from a link-only card to a live check.
 */
export function getUnconfiguredChecks(): CheckResult[] {
  return [
    {
      name: "Security (Cloudflare)",
      status: "not_configured",
      detail: "No CLOUDFLARE_API_TOKEN configured — add one to check zone/SSL/DNS status live.",
      href: "https://dash.cloudflare.com",
    },
    {
      name: "Vercel",
      status: "not_configured",
      detail: "Not currently used for hosting (Railway is) — kept as a link in case that changes.",
      href: "https://vercel.com/dashboard",
    },
  ];
}

export function getQuickLinks(): { name: string; href: string }[] {
  return [
    { name: "GitHub repo", href: "https://github.com/lesimpsonprogrammer/cp_service_manager" },
    { name: "Supabase project", href: "https://supabase.com/dashboard/project/ucuejofewehpuxcwvubu" },
    { name: "Railway project", href: "https://railway.com/project/6b6ae1b8-8c94-4b88-beb4-4878773800d5" },
    { name: "Cloudflare dashboard", href: "https://dash.cloudflare.com" },
  ];
}
