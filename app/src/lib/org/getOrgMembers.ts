import { createClient } from "@/lib/supabase/server";

export interface OrgMemberOption {
  userId: string;
  fullName: string;
  role: string;
}

/**
 * Staff roster for an org, with display names — used to populate "assign
 * to a staff member" pickers (e.g. Project Manager on a client).
 */
export async function getOrgMembers(orgId: string): Promise<OrgMemberOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_members")
    .select("user_id, role, profiles ( full_name )")
    .eq("org_id", orgId)
    .returns<{ user_id: string; role: string; profiles: { full_name: string | null } | null }[]>();

  return (data ?? []).map((m) => ({
    userId: m.user_id,
    fullName: m.profiles?.full_name?.trim() || "Unnamed teammate",
    role: m.role,
  }));
}
