import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import type { VerifiedSession } from "./access-policy";

export type CpsmSession = VerifiedSession;

function permissionsForRole(role: string): string[] {
  const permissions = ["jaren:chat"];
  if (role === "owner" || role === "admin") {
    permissions.push(
      "jaren:health",
      "jaren:connector:configure",
      "jaren:sql:write",
      "jaren:schema:change",
      "jaren:transfer:execute",
      "jaren:automation:enable",
      "jaren:data:delete",
    );
  }
  return permissions;
}

/** Resolves the real, signed-in CPSM session for the Jaren routes. */
export async function requireCpsmSession(): Promise<CpsmSession | Response> {
  const deny = (status: number, error: string) =>
    Response.json({ error }, { status, headers: { "cache-control": "no-store" } });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return deny(401, "Sign in to CPSM to use Jaren.");

  const org = await getCurrentOrg();
  if (!org) return deny(403, "No workspace membership found for this account.");

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const expiresAt = session?.expires_at ? session.expires_at * 1000 : 0;
  if (!expiresAt) return deny(401, "Session expired. Sign in again.");

  return {
    userId: org.userId,
    tenantId: org.orgId,
    permissions: permissionsForRole(org.role),
    roles: [org.role],
    expiresAt,
  };
}
