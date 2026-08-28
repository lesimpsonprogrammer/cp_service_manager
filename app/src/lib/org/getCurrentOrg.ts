import { createClient } from "@/lib/supabase/server";

export interface CurrentOrg {
  orgId: string;
  orgName: string;
  role: string;
  userId: string;
  userEmail: string | null;
}

/**
 * Resolves the signed-in user's primary organization (the one created for
 * them at signup). Multi-org switching is out of scope for this scaffold —
 * `org_members` already supports it if/when a switcher UI is added.
 */
export async function getCurrentOrg(): Promise<CurrentOrg | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role, organizations ( name )")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ org_id: string; role: string; organizations: { name: string } | null }>();

  if (!membership) return null;

  return {
    orgId: membership.org_id,
    orgName: membership.organizations?.name ?? "Workspace",
    role: membership.role,
    userId: user.id,
    userEmail: user.email ?? null,
  };
}
