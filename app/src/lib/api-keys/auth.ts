import { createAdminClient } from "@/lib/supabase/admin";
import { hashApiKey } from "./hash";

export interface ApiKeyAuth {
  orgId: string;
  apiKeyId: string;
}

/**
 * Authenticates a request to /api/v1/* against `Authorization: Bearer <key>`.
 * Uses the service-role client because we don't yet know which org (and
 * therefore whose RLS context) the request belongs to until the key is
 * resolved.
 */
export async function authenticateApiKey(request: Request): Promise<ApiKeyAuth | null> {
  const authHeader = request.headers.get("authorization") ?? "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const admin = createAdminClient();
  const { data: apiKey } = await admin
    .from("api_keys")
    .select("id, org_id, revoked_at")
    .eq("key_hash", hashApiKey(match[1]!))
    .is("revoked_at", null)
    .maybeSingle();

  if (!apiKey) return null;

  await admin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", apiKey.id);

  return { orgId: apiKey.org_id, apiKeyId: apiKey.id };
}

export function unauthorized() {
  return Response.json({ error: "Missing or invalid API key." }, { status: 401 });
}
