"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { getAccountingConnectionFields, getAccountingConnectionTypeDefinition } from "@/lib/accounting/registry";
import type { AccountingConnectionType } from "@/types/database";

export interface AccountingConnectionFormState {
  error: string | null;
}

export async function saveAccountingConnection(
  connectionType: AccountingConnectionType,
  _prev: AccountingConnectionFormState,
  formData: FormData
): Promise<AccountingConnectionFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };
  if (org.role !== "owner" && org.role !== "admin") {
    return { error: "Only workspace owners/admins can manage Global Accounting connections." };
  }

  const definition = getAccountingConnectionTypeDefinition(connectionType);
  if (!definition) return { error: "Unknown connection type." };

  const fields = getAccountingConnectionFields();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("accounting_connections")
    .select("config")
    .eq("org_id", org.orgId)
    .eq("connection_type", connectionType)
    .maybeSingle();

  const existingConfig = (existing?.config as Record<string, unknown>) ?? {};
  const config: Record<string, unknown> = { ...existingConfig };

  for (const field of fields) {
    const raw = formData.get(`field_${field.key}`);
    const value = raw === null ? "" : String(raw);

    if (field.secret) {
      // A blank submit means "leave the existing secret as-is", same
      // pattern as connector data sources.
      if (value !== "") {
        config[field.key] = value;
      } else if (field.required && !existingConfig[field.key]) {
        return { error: `${field.label} is required.` };
      }
      continue;
    }

    if (field.required && !value) {
      return { error: `${field.label} is required.` };
    }

    if (value === "") delete config[field.key];
    else config[field.key] = value;
  }

  const companyName = config.company_name ? String(config.company_name).trim() || null : null;

  const { error } = await supabase.from("accounting_connections").upsert(
    {
      org_id: org.orgId,
      connection_type: connectionType,
      provider: "quickbooks",
      company_name: companyName,
      config,
      status: "connected",
      last_synced_at: new Date().toISOString(),
      created_by: org.userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id,connection_type" }
  );

  if (error) return { error: error.message };

  revalidatePath("/accounting");
  return { error: null };
}

export async function disconnectAccountingConnection(connectionType: AccountingConnectionType) {
  const org = await getCurrentOrg();
  if (!org) return;
  if (org.role !== "owner" && org.role !== "admin") return;

  const supabase = await createClient();
  await supabase
    .from("accounting_connections")
    .update({ status: "not_connected", config: {}, updated_at: new Date().toISOString() })
    .eq("org_id", org.orgId)
    .eq("connection_type", connectionType);

  revalidatePath("/accounting");
}
