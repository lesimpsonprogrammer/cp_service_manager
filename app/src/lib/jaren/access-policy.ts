/** Inputs must come from CPSM's verified server session, never the request body or LLM. */
export type VerifiedSession = {
  userId: string;
  tenantId: string;
  permissions: string[];
  roles: string[];
  expiresAt: number; // Unix milliseconds
};

const actions = {
  chat: { permission: "jaren:chat", admin: false },
  health: { permission: "jaren:health", admin: true },
  "connector.configure": { permission: "jaren:connector:configure", admin: true },
  "sql.write": { permission: "jaren:sql:write", admin: true },
  "schema.change": { permission: "jaren:schema:change", admin: true },
  "transfer.execute": { permission: "jaren:transfer:execute", admin: true },
  "automation.enable": { permission: "jaren:automation:enable", admin: true },
  "data.delete": { permission: "jaren:data:delete", admin: true },
} as const;

export function authorize(
  session: VerifiedSession | null,
  action: string,
  resourceTenantId: string,
  now = Date.now(),
): Response | null {
  const deny = (status: number) => Response.json(
    { error: "Access denied. Use your CPSM account and required workspace role." },
    { status, headers: { "cache-control": "no-store" } },
  );
  if (!session || !session.userId || !session.tenantId ||
      !Number.isFinite(session.expiresAt) || session.expiresAt <= now) return deny(401);
  if (!Object.hasOwn(actions, action) || !resourceTenantId ||
      session.tenantId !== resourceTenantId) return deny(403);
  const policy = actions[action as keyof typeof actions];
  if (!Array.isArray(session.permissions) || !session.permissions.includes(policy.permission)) return deny(403);
  // CPSM has no step-up MFA yet, so admin-tier actions here only require the
  // owner/admin role — tighten this once CPSM has a real MFA event to check.
  if (policy.admin) {
    if (!Array.isArray(session.roles) || !session.roles.some((r) => r === "owner" || r === "admin")) {
      return deny(403);
    }
  }
  return null;
}

/** Exact configured origin: never derive trust from Host or forwarded headers. */
export function checkMutationOrigin(request: Request, configuredOrigin?: string): Response | null {
  let expected: string;
  try {
    const url = new URL(configuredOrigin ?? "");
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password ||
        url.pathname !== "/" || url.search || url.hash) throw new Error("Invalid origin");
    expected = url.origin;
  } catch {
    return Response.json({ error: "CPSM application origin is not configured." }, { status: 503 });
  }
  if (request.headers.get("origin") !== expected || request.headers.get("sec-fetch-site") === "cross-site") {
    return Response.json({ error: "Request origin denied." }, { status: 403 });
  }
  return null;
}

/** Enforce a real byte limit even when Content-Length is missing or false. */
export async function readBoundedJson(request: Request, limit = 128 * 1024): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "application/json") {
    throw new Error("unsupported-content-type");
  }
  if (!request.body) throw new Error("invalid-json");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > limit) { await reader.cancel(); throw new Error("request-too-large"); }
      chunks.push(next.value);
    }
  } finally { reader.releaseLock(); }
  const joined = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(joined));
}
