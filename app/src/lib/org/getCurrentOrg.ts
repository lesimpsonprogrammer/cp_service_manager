import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export interface CurrentOrg {
  orgId: string;
  orgName: string;
  role: string;
  userId: string;
  userEmail: string | null;
}

export interface OrgMembershipOption {
  orgId: string;
  orgName: string;
  role: string;
}

export const ACTIVE_ORG_COOKIE = "active_org_id";

type MembershipRow = { org_id: string; role: string; organizations: { name: string } | null };

async function getMemberships(userId: string): Promise<MembershipRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_members")
    .select("org_id, role, organizations ( name )")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .returns<MembershipRow[]>();

  return data ?? [];
}

/**
 * Resolves the signed-in user's active organization. A user can belong to
 * several orgs (`org_members`); the active one is whichever org_id is in the
 * `active_org_id` cookie, falling back to the earliest membership if the
 * cookie is unset or points at an org the user isn't actually a member of.
 */
export async function getCurrentOrg(): Promise<CurrentOrg | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const memberships = await getMemberships(user.id);
  const fallback = memberships[0];
  if (!fallback) return null;

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const active = memberships.find((m) => m.org_id === activeOrgId) ?? fallback;

  return {
    orgId: active.org_id,
    orgName: active.organizations?.name ?? "Workspace",
    role: active.role,
    userId: user.id,
    userEmail: user.email ?? null,
  };
}

/** Every org the signed-in user belongs to, for rendering an org switcher. */
export async function getOrgMemberships(): Promise<OrgMembershipOption[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const memberships = await getMemberships(user.id);
  return memberships.map((m) => ({
    orgId: m.org_id,
    orgName: m.organizations?.name ?? "Workspace",
    role: m.role,
  }));
}
