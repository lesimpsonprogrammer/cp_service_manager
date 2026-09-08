"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";

const ADMIN_ROLES = new Set(["owner", "admin"]);

export interface SqlEditorResult {
  rows: Record<string, unknown>[] | null;
  error: string | null;
  durationMs: number;
}

export async function runSqlEditorQuery(query: string, clientId: string | null = null): Promise<SqlEditorResult> {
  const org = await getCurrentOrg();
  if (!org || !ADMIN_ROLES.has(org.role)) {
    return { rows: null, error: "The SQL editor is limited to organization owners and admins.", durationMs: 0 };
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return { rows: null, error: "Enter a query to run.", durationMs: 0 };
  }

  const supabase = await createClient();
  const start = Date.now();
  const { data, error } = await supabase.rpc("run_sql_editor_query", { query: trimmed, client_id: clientId });
  const durationMs = Date.now() - start;

  if (error) {
    return { rows: null, error: error.message, durationMs };
  }

  return { rows: (data as Record<string, unknown>[] | null) ?? [], error: null, durationMs };
}

export interface QueryLogEntry {
  id: string;
  query: string;
  status: "success" | "error";
  row_count: number | null;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
}

export async function getRecentQueryLog(): Promise<QueryLogEntry[]> {
  const org = await getCurrentOrg();
  if (!org || !ADMIN_ROLES.has(org.role)) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("sql_editor_query_log")
    .select("id, query, status, row_count, duration_ms, error_message, created_at")
    .eq("org_id", org.orgId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data as QueryLogEntry[] | null) ?? [];
}

export interface ScopableClient {
  id: string;
  name: string;
}

export async function getScopableClients(): Promise<ScopableClient[]> {
  const org = await getCurrentOrg();
  if (!org || !ADMIN_ROLES.has(org.role)) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, name")
    .eq("org_id", org.orgId)
    .order("name", { ascending: true });

  return (data as ScopableClient[] | null) ?? [];
}
