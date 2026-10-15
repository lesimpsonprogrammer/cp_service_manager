import { createClient } from "@/lib/supabase/server";

export interface OrgMemberOption {
  userId: string;
  fullName: string;
  role: string;
}

/**
 * Staff roster for an org, with display names — used to populate "assign
 * to a staff member" pickers (e.g. Project Manager on a client).
 *
 * Two queries rather than an embedded `profiles ( full_name )` select:
 * org_members and profiles both reference auth.users but not each other,
 * so PostgREST can't embed one in the other and the embed returns an error.
 */
export async function getOrgMembers(orgId: string): Promise<OrgMemberOption[]> {
  const supabase = await createClient();
  const { data: members } = await supabase.from("org_members").select("user_id, role").eq("org_id", orgId);
  if (!members?.length) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in(
      "id",
      members.map((m) => m.user_id)
    );
  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name?.trim() || null]));

  return members
    .map((m) => ({
      userId: m.user_id,
      fullName: names.get(m.user_id) || "Unnamed teammate",
      role: m.role,
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}
