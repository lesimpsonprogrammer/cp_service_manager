import type { createAdminClient } from "@/lib/supabase/admin";
import { SEEN_WRITE_INTERVAL_SECONDS, hashToken } from "./widget";

// Service-role lookups behind the public /api/chat/* routes. Every query is
// scoped by the widget key or the visitor's token hash, never by anything
// else the visitor sends.

type Db = ReturnType<typeof createAdminClient>;

export interface WidgetSettings {
  org_id: string;
  widget_key: string;
  is_enabled: boolean;
  title: string;
  greeting: string;
  accent_color: string;
  default_assignee_id: string | null;
  allowed_origins: string[];
  site_url: string | null;
}

export async function loadWidget(admin: Db, key: string): Promise<WidgetSettings | null> {
  const { data } = await admin
    .from("chat_widget_settings")
    .select("org_id, widget_key, is_enabled, title, greeting, accent_color, default_assignee_id, allowed_origins, site_url")
    .eq("widget_key", key)
    .maybeSingle();
  return data ?? null;
}

/**
 * Who a new chat goes to: the widget's chosen owner if they're still on the
 * team, otherwise the workspace's first owner, so a chat never sits
 * unassigned with nobody emailed.
 */
export async function resolveChatAssignee(admin: Db, orgId: string, preferred: string | null): Promise<string | null> {
  if (preferred) {
    const { data } = await admin
      .from("org_members")
      .select("user_id")
      .eq("org_id", orgId)
      .eq("user_id", preferred)
      .maybeSingle();
    if (data) return preferred;
  }
  const { data: owner } = await admin
    .from("org_members")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("role", "owner")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return owner?.user_id ?? null;
}

export interface VisitorSession {
  id: string;
  org_id: string;
  ticket_id: string;
  visitor_name: string | null;
  visitor_email: string;
  last_seen_at: string;
  staff_notified_at: string | null;
}

export async function loadSessionByToken(admin: Db, token: string): Promise<VisitorSession | null> {
  const { data } = await admin
    .from("chat_sessions")
    .select("id, org_id, ticket_id, visitor_name, visitor_email, last_seen_at, staff_notified_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  return data ?? null;
}

/** Marks the visitor as present, at most every SEEN_WRITE_INTERVAL_SECONDS. */
export async function touchSession(admin: Db, session: VisitorSession): Promise<void> {
  const age = Date.now() - new Date(session.last_seen_at).getTime();
  if (age < SEEN_WRITE_INTERVAL_SECONDS * 1000) return;
  await admin.from("chat_sessions").update({ last_seen_at: new Date().toISOString() }).eq("id", session.id);
}

export async function loadChatTicket(admin: Db, ticketId: string) {
  const { data } = await admin
    .from("tickets")
    .select("id, org_id, status, description, created_at, requester_name")
    .eq("id", ticketId)
    .maybeSingle();
  return data ?? null;
}

export async function loadVisibleMessages(admin: Db, ticketId: string) {
  const { data } = await admin
    .from("ticket_messages")
    .select("id, author_type, author_name, body, is_internal, created_at")
    .eq("ticket_id", ticketId)
    .eq("is_internal", false)
    .order("created_at");
  return data ?? [];
}
