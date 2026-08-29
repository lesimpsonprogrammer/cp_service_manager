"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { getConnectorAdapter } from "@/lib/connectors";
import { getConnectorDefinition } from "@/lib/connectors/registry";
import type { DataSourceType } from "@/types/database";
import type { ConnectionTestResult } from "@/lib/connectors/types";

export interface DataSourceFormState {
  error: string | null;
}

export async function createDataSource(
  _prev: DataSourceFormState,
  formData: FormData
): Promise<DataSourceFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };

  const type = String(formData.get("type") ?? "") as DataSourceType;
  const name = String(formData.get("name") ?? "").trim();
  const clientId = String(formData.get("client_id") ?? "").trim() || null;
  const definition = getConnectorDefinition(type);

  if (!definition) return { error: "Unknown connector type." };
  if (!name) return { error: "Give this data source a name." };

  const config: Record<string, unknown> = {};
  for (const field of definition.fields) {
    const value = formData.get(`field_${field.key}`);
    if (field.required && !value) {
      return { error: `${field.label} is required.` };
    }
    if (value !== null && value !== "") config[field.key] = String(value);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("data_sources")
    .insert({
      org_id: org.orgId,
      name,
      type,
      config,
      client_id: clientId,
      status: "pending",
      created_by: org.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create data source." };
  }

  revalidatePath("/data-sources");
  redirect(`/data-sources/${data.id}`);
}

export async function testDataSourceConnection(dataSourceId: string): Promise<ConnectionTestResult> {
  const org = await getCurrentOrg();
  if (!org) return { ok: false, message: "Not signed in." };

  const supabase = await createClient();
  const { data: source, error } = await supabase
    .from("data_sources")
    .select("id, type, config")
    .eq("id", dataSourceId)
    .single();

  if (error || !source) return { ok: false, message: "Data source not found." };

  const adapter = getConnectorAdapter(source.type);
  if (!adapter) return { ok: false, message: `No adapter available for "${source.type}" yet.` };

  const result = await adapter.testConnection(source.config ?? {});

  await supabase
    .from("data_sources")
    .update({
      status: result.ok ? "connected" : "error",
      last_synced_at: result.ok ? new Date().toISOString() : undefined,
    })
    .eq("id", dataSourceId);

  revalidatePath(`/data-sources/${dataSourceId}`);
  revalidatePath("/data-sources");

  return result;
}

export async function assignDataSourceClient(dataSourceId: string, clientId: string | null) {
  const supabase = await createClient();
  await supabase
    .from("data_sources")
    .update({ client_id: clientId, updated_at: new Date().toISOString() })
    .eq("id", dataSourceId);

  revalidatePath(`/data-sources/${dataSourceId}`);
  if (clientId) revalidatePath(`/clients/${clientId}`);
}

export async function deleteDataSource(dataSourceId: string) {
  const supabase = await createClient();
  await supabase.from("data_sources").delete().eq("id", dataSourceId);
  revalidatePath("/data-sources");
  redirect("/data-sources");
}
