"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";

const ADMIN_ROLES = new Set(["owner", "admin"]);

export interface SqlEditorResult {
  rows: Record<string, unknown>[] | null;
  error: string | null;
  durationMs: number;
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

export interface DataStudioColumn {
  name: string;
  dataType: string;
  udtName: string;
  nullable: boolean;
  defaultValue: string | null;
  identity: boolean;
  generated: boolean;
}

export interface DataStudioTable {
  tableName: string;
  label: string;
  primaryKeyColumns: string[];
  orgScopeColumn: string | null;
  clientScopeColumn: string | null;
  allowRead: boolean;
  allowInsert: boolean;
  allowUpdate: boolean;
  allowDelete: boolean;
  protectedColumns: string[];
  columns: DataStudioColumn[];
}

export interface DataStudioClient {
  id: string;
  name: string;
}

export interface MutationLogEntry {
  id: string;
  client_id: string | null;
  table_name: string;
  operation: "insert" | "update" | "delete";
  key_data: Record<string, unknown>;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: string;
}

export interface MutationResult {
  data: {
    operation: "insert" | "update" | "delete";
    tableName: string;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
  } | null;
  error: string | null;
}

async function requireAdminOrg() {
  const org = await getCurrentOrg();
  if (!org || !ADMIN_ROLES.has(org.role)) return null;
  return org;
}

export async function runSqlEditorQuery(query: string, clientId: string | null = null): Promise<SqlEditorResult> {
  const org = await requireAdminOrg();
  if (!org) {
    return { rows: null, error: "The Data Studio is limited to organization owners and admins.", durationMs: 0 };
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return { rows: null, error: "Enter a query to run.", durationMs: 0 };
  }

  const supabase = await createClient();
  const start = Date.now();
  const { data, error } = await (supabase.rpc as any)("run_sql_editor_query", {
    query: trimmed,
    client_id: clientId,
  });
  const durationMs = Date.now() - start;

  if (error) {
    return { rows: null, error: error.message, durationMs };
  }

  return { rows: (data as Record<string, unknown>[] | null) ?? [], error: null, durationMs };
}

export async function getRecentQueryLog(): Promise<QueryLogEntry[]> {
  const org = await requireAdminOrg();
  if (!org) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("sql_editor_query_log")
    .select("id, query, status, row_count, duration_ms, error_message, created_at")
    .eq("org_id", org.orgId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data as QueryLogEntry[] | null) ?? [];
}

export async function getDataStudioSchema(): Promise<DataStudioTable[]> {
  const org = await requireAdminOrg();
  if (!org) return [];

  const supabase = await createClient();
  const { data, error } = await (supabase.rpc as any)("get_data_studio_schema", {
    p_org_id: org.orgId,
  });

  if (error) return [];
  return (data as DataStudioTable[] | null) ?? [];
}

export async function getDataStudioClients(): Promise<DataStudioClient[]> {
  const org = await requireAdminOrg();
  if (!org) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, name")
    .eq("org_id", org.orgId)
    .order("name", { ascending: true });

  return (data as DataStudioClient[] | null) ?? [];
}

export async function browseDataStudioTable(
  tableName: string,
  clientId: string | null = null,
): Promise<SqlEditorResult> {
  const org = await requireAdminOrg();
  if (!org) {
    return { rows: null, error: "The Data Studio is limited to organization owners and admins.", durationMs: 0 };
  }

  const tables = await getDataStudioSchema();
  const table = tables.find((item) => item.tableName === tableName && item.allowRead);
  if (!table) {
    return { rows: null, error: "That table is not enabled for Data Studio.", durationMs: 0 };
  }

  if (clientId && !table.clientScopeColumn) {
    return { rows: null, error: `${table.label} is organization-scoped and cannot be filtered by client.`, durationMs: 0 };
  }

  const predicates: string[] = [];
  if (table.orgScopeColumn) {
    predicates.push(`"${table.orgScopeColumn}" = '${org.orgId}'::uuid`);
  }
  if (clientId && table.clientScopeColumn) {
    predicates.push(`"${table.clientScopeColumn}" = '${clientId}'::uuid`);
  }

  const createdAt = table.columns.some((column) => column.name === "created_at");
  const query = [
    `select * from "${table.tableName}"`,
    predicates.length ? `where ${predicates.join(" and ")}` : "",
    createdAt ? 'order by "created_at" desc' : "",
    "limit 100",
  ]
    .filter(Boolean)
    .join("\n");

  return runSqlEditorQuery(query, clientId);
}

export async function mutateDataStudioRow(input: {
  tableName: string;
  operation: "insert" | "update" | "delete";
  key?: Record<string, unknown>;
  values?: Record<string, unknown>;
  clientId?: string | null;
}): Promise<MutationResult> {
  const org = await requireAdminOrg();
  if (!org) return { data: null, error: "The Data Studio is limited to organization owners and admins." };

  const supabase = await createClient();
  const { data, error } = await (supabase.rpc as any)("run_data_studio_mutation", {
    p_org_id: org.orgId,
    p_table_name: input.tableName,
    p_operation: input.operation,
    p_key: input.key ?? {},
    p_values: input.values ?? {},
    p_client_id: input.clientId ?? null,
  });

  if (error) return { data: null, error: error.message };
  return { data: data as MutationResult["data"], error: null };
}

export async function getRecentMutationLog(): Promise<MutationLogEntry[]> {
  const org = await requireAdminOrg();
  if (!org) return [];

  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("data_studio_mutation_log")
    .select("id, client_id, table_name, operation, key_data, before_data, after_data, created_at")
    .eq("org_id", org.orgId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return [];
  return (data as MutationLogEntry[] | null) ?? [];
}
