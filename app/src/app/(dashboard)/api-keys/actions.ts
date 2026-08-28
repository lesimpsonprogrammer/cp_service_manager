"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { generateApiKey } from "@/lib/api-keys/hash";

export interface ApiKeyFormState {
  error: string | null;
  createdKey: string | null;
}

export async function createApiKey(
  _prev: ApiKeyFormState,
  formData: FormData
): Promise<ApiKeyFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in.", createdKey: null };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name this key so you remember what it's for.", createdKey: null };

  const generated = generateApiKey();
  const supabase = await createClient();
  const { error } = await supabase.from("api_keys").insert({
    org_id: org.orgId,
    name,
    key_prefix: generated.prefix,
    key_hash: generated.hash,
    created_by: org.userId,
  });

  if (error) return { error: error.message, createdKey: null };

  revalidatePath("/api-keys");
  return { error: null, createdKey: generated.plaintext };
}

export async function revokeApiKey(apiKeyId: string) {
  const supabase = await createClient();
  await supabase.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", apiKeyId);
  revalidatePath("/api-keys");
}
