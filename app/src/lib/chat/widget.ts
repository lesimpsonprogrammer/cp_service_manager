import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

// Website chat: shared rules for the public /api/chat/* routes and the
// widget they serve (public/chat-widget.js). Visitors have no Supabase
// session — the random token their browser keeps is the credential, and
// only its SHA-256 hash is stored (chat_sessions.token_hash).

export const MAX_CHAT_MESSAGE_CHARS = 4000;
/** New chats one visitor (IP) can open per hour. */
export const MAX_NEW_CHATS_PER_HOUR = 5;
/** Messages one visitor can send per minute in a chat. */
export const MAX_MESSAGES_PER_MINUTE = 8;
/** A visitor polled this recently counts as "online" (no reply emails, green dot in the inbox). */
export const ONLINE_WINDOW_SECONDS = 60;
/** Don't email the team about every line of a back-and-forth. */
export const STAFF_RENOTIFY_MINUTES = 3;
/** Only write last_seen_at this often, not on every poll. */
export const SEEN_WRITE_INTERVAL_SECONDS = 20;

export const DEFAULT_SITE_URL = "https://www.momentumdatasolutions.com";

export function newVisitorToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Salted per workspace so the stored value can't be matched across tables or reversed by lookup. */
export function hashIp(ip: string | null, orgId: string): string | null {
  if (!ip) return null;
  return createHash("sha256").update(`${orgId}:${ip}`).digest("hex");
}

export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim() || null;
  return request.headers.get("x-real-ip");
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+([A-Za-z0-9_-]{20,128})$/);
  return match ? match[1]! : null;
}

export function isOnline(lastSeenAt: string | null | undefined, now = Date.now()): boolean {
  if (!lastSeenAt) return false;
  return now - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_SECONDS * 1000;
}

/** Where a chat visitor lands from an email: the site, with the widget opened. */
export function chatReturnUrl(siteUrl: string | null | undefined): string {
  const base = (siteUrl || DEFAULT_SITE_URL).replace(/\/+$/, "");
  return `${base}/?chat=open`;
}

/** Subject line for the ticket behind a chat: the visitor's first words. */
export function chatSubject(message: string): string {
  const oneLine = message.replace(/\s+/g, " ").trim();
  const clipped = oneLine.length > 80 ? `${oneLine.slice(0, 77).trimEnd()}…` : oneLine;
  return `Website chat: ${clipped}`;
}

// ---------------------------------------------------------------------------
// CORS: the widget runs on the marketing site, the API on the app domain.
// ---------------------------------------------------------------------------

export function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin.toLowerCase();
  } catch {
    return null;
  }
}

/** Empty allow-list = any site may embed. Otherwise the Origin must match exactly. */
export function isOriginAllowed(origin: string | null, allowed: string[]): boolean {
  if (allowed.length === 0) return true;
  if (!origin) return false;
  const normalized = normalizeOrigin(origin);
  return !!normalized && allowed.some((a) => normalizeOrigin(a) === normalized);
}

export function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
    "Cache-Control": "no-store",
  };
}

export function chatJson(body: unknown, origin: string | null, init: { status?: number } = {}): Response {
  return Response.json(body, { status: init.status ?? 200, headers: corsHeaders(origin) });
}

export function preflight(request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

const messageBody = z
  .string()
  .trim()
  .min(1, "Type a message first.")
  .max(MAX_CHAT_MESSAGE_CHARS, `Keep messages under ${MAX_CHAT_MESSAGE_CHARS} characters.`);

export const startChatSchema = z.object({
  key: z.string().regex(/^[A-Za-z0-9_-]{6,64}$/, "Unknown chat widget."),
  name: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => v || null),
  email: z.string().trim().toLowerCase().email("Enter a valid email so we can reach you.").max(254),
  message: messageBody,
  page_url: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v && /^https?:\/\//.test(v) ? v : null)),
  // Honeypot: hidden in the widget, so only bots fill it in.
  website: z.string().optional(),
});

export const chatMessageSchema = z.object({ message: messageBody });

export function firstChatIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid request.";
}

// ---------------------------------------------------------------------------
// Output: what a visitor may see of the ticket behind their chat.
// ---------------------------------------------------------------------------

export interface VisitorMessage {
  id: string;
  from: "visitor" | "team";
  name: string | null;
  body: string;
  at: string;
}

export function toVisitorMessages(
  ticket: { id: string; description: string; created_at: string; requester_name: string | null },
  messages: { id: string; author_type: string; author_name: string | null; body: string; is_internal: boolean; created_at: string }[]
): VisitorMessage[] {
  const opening: VisitorMessage = {
    id: `${ticket.id}:opening`,
    from: "visitor",
    name: ticket.requester_name,
    body: ticket.description,
    at: ticket.created_at,
  };
  const rest = messages
    // Internal notes and system lines never reach the visitor.
    .filter((m) => !m.is_internal && (m.author_type === "client" || m.author_type === "staff"))
    .map<VisitorMessage>((m) => ({
      id: m.id,
      from: m.author_type === "client" ? "visitor" : "team",
      name: m.author_type === "staff" ? firstName(m.author_name) : m.author_name,
      body: m.body,
      at: m.created_at,
    }));
  return [opening, ...rest];
}

/** Visitors see "Larry", not the full staff name. */
function firstName(name: string | null): string | null {
  if (!name) return null;
  return name.trim().split(/\s+/)[0] ?? null;
}
