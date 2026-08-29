import { createClient } from "@/lib/supabase/server";

export interface CurrentClientPortalUser {
  userId: string;
  userEmail: string | null;
  orgId: string;
  clientId: string;
  clientName: string;
  passwordUpdatedAt: string;
}

/**
 * Resolves the signed-in user's client-portal membership (if any). Distinct
 * from `getCurrentOrg` — a client portal user is never an `org_members` row,
 * so the two are mutually exclusive for a given auth user.
 */
export async function getCurrentClientPortalUser(): Promise<CurrentClientPortalUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("client_portal_users")
    .select("org_id, client_id, password_updated_at, clients ( name )")
    .eq("id", user.id)
    .maybeSingle<{
      org_id: string;
      client_id: string;
      password_updated_at: string;
      clients: { name: string } | null;
    }>();

  if (!membership) return null;

  return {
    userId: user.id,
    userEmail: user.email ?? null,
    orgId: membership.org_id,
    clientId: membership.client_id,
    clientName: membership.clients?.name ?? "Your workspace",
    passwordUpdatedAt: membership.password_updated_at,
  };
}
