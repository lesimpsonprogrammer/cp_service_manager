import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApiKey, unauthorized } from "@/lib/api-keys/auth";
import { getConnectorDefinition } from "@/lib/connectors/registry";
import type { DataSourceType } from "@/types/database";

export async function GET(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("data_sources")
    .select("id, name, type, status, last_synced_at, created_at")
    .eq("org_id", auth.orgId)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}

export async function POST(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, type, config } = body as { name?: string; type?: DataSourceType; config?: Record<string, unknown> };
  const definition = type ? getConnectorDefinition(type) : undefined;

  if (!name) return Response.json({ error: "`name` is required." }, { status: 400 });
  if (!definition) return Response.json({ error: `Unknown connector type "${type}".` }, { status: 400 });

  for (const field of definition.fields) {
    if (field.required && !(config ?? {})[field.key]) {
      return Response.json({ error: `\`config.${field.key}\` (${field.label}) is required.` }, { status: 400 });
    }
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("data_sources")
    .insert({ org_id: auth.orgId, name, type: type as DataSourceType, config: config ?? {}, status: "pending" })
    .select("id, name, type, status, created_at")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data }, { status: 201 });
}
