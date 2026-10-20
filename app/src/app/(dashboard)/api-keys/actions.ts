"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { generateApiKey } from "@/lib/api-keys/hash";
import { emitEvent } from "@/lib/webhooks/emit";

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
  const { data: key, error } = await supabase
    .from("api_keys")
    .insert({
      org_id: org.orgId,
      name,
      key_prefix: generated.prefix,
      key_hash: generated.hash,
      created_by: org.userId,
    })
    .select("id")
    .single();

  if (error || !key) return { error: error?.message ?? "Couldn't create the key.", createdKey: null };

  emitEvent(org.orgId, "security.api_key.created", {
    id: key.id,
    name,
    key_prefix: generated.prefix,
    actor_email: org.userEmail,
    org_name: org.orgName,
  });

  revalidatePath("/api-keys");
  return { error: null, createdKey: generated.plaintext };
}

export async function revokeApiKey(apiKeyId: string) {
  const org = await getCurrentOrg();
  const supabase = await createClient();
  const { data: key } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", apiKeyId)
    .is("revoked_at", null)
    .select("id, org_id, name, key_prefix")
    .maybeSingle();

  if (key) {
    emitEvent(key.org_id, "security.api_key.revoked", {
      id: key.id,
      name: key.name,
      key_prefix: key.key_prefix,
      actor_email: org?.userEmail ?? null,
      org_name: org?.orgName ?? null,
    });
  }
  revalidatePath("/api-keys");
}
