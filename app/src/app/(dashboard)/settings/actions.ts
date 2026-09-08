"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import type { OrgRole } from "@/types/database";

export interface SettingsFormState {
  error: string | null;
}

const ADMIN_ROLES = new Set(["owner", "admin"]);
const VALID_ROLES = new Set<OrgRole>(["owner", "admin", "member", "viewer"]);

type MemberStatus = "active" | "suspended" | "removed";

async function setMemberStatus(userId: string, status: MemberStatus): Promise<SettingsFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };
  if (!ADMIN_ROLES.has(org.role)) return { error: "Only owners and admins can change member status." };
  if (userId === org.userId) return { error: "You can't change your own status." };

  const supabase = await createClient();

  const { data: target } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", org.orgId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!target) return { error: "That person isn't a member of this workspace." };

  if (target.role === "owner" && status !== "active") {
    const { count } = await supabase
      .from("org_members")
      .select("user_id", { count: "exact", head: true })
      .eq("org_id", org.orgId)
      .eq("role", "owner")
      .eq("status", "active");

    if ((count ?? 0) <= 1) return { error: "Can't change the last active owner's status." };
  }

  const { error } = await supabase
    .from("org_members")
    .update({ status, status_changed_at: new Date().toISOString(), status_changed_by: org.userId })
    .eq("org_id", org.orgId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/settings/team");
  return { error: null };
}

/** Soft-removes a member into the recycle bin -- revokes access immediately, restorable later. */
export async function removeMember(userId: string): Promise<SettingsFormState> {
  return setMemberStatus(userId, "removed");
}

/** Temporarily blocks access without removing the membership. */
export async function suspendMember(userId: string): Promise<SettingsFormState> {
  return setMemberStatus(userId, "suspended");
}

/** Restores a suspended or removed member back to active. */
export async function restoreMember(userId: string): Promise<SettingsFormState> {
  return setMemberStatus(userId, "active");
}

export async function createInvite(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };
  if (!ADMIN_ROLES.has(org.role)) return { error: "Only owners and admins can invite people." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "member") as OrgRole;
  if (!email) return { error: "Enter an email address." };
  if (!VALID_ROLES.has(role)) return { error: "Invalid role." };

  const supabase = await createClient();
  const { error } = await supabase.from("org_invites").insert({
    org_id: org.orgId,
    email,
    role,
    invited_by: org.userId,
  });

  if (error) return { error: error.message };

  revalidatePath("/settings/team");
  return { error: null };
}

export async function revokeInvite(inviteId: string) {
  const org = await getCurrentOrg();
  if (!org || !ADMIN_ROLES.has(org.role)) return;

  const supabase = await createClient();
  await supabase.from("org_invites").delete().eq("id", inviteId).is("accepted_at", null);

  revalidatePath("/settings/team");
}

export async function approveSignupRequest(
  requestId: string,
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };
  if (!ADMIN_ROLES.has(org.role)) return { error: "Only owners and admins can approve signups." };

  const role = String(formData.get("role") ?? "member") as OrgRole;
  if (!VALID_ROLES.has(role)) return { error: "Invalid role." };

  const supabase = await createClient();

  const { data: request } = await supabase
    .from("signup_requests")
    .select("id, user_id, status")
    .eq("id", requestId)
    .single();

  if (!request) return { error: "Signup request not found." };
  if (request.status !== "pending") return { error: "This request was already decided." };

  const { error: memberError } = await supabase.from("org_members").insert({
    org_id: org.orgId,
    user_id: request.user_id,
    role,
  });
  if (memberError) return { error: memberError.message };

  const { error } = await supabase
    .from("signup_requests")
    .update({
      status: "approved",
      decided_at: new Date().toISOString(),
      decided_by: org.userId,
      decision_org_id: org.orgId,
      decision_role: role,
    })
    .eq("id", requestId);

  if (error) return { error: error.message };

  revalidatePath("/settings/team");
  return { error: null };
}

export async function rejectSignupRequest(requestId: string) {
  const org = await getCurrentOrg();
  if (!org || !ADMIN_ROLES.has(org.role)) return;

  const supabase = await createClient();
  await supabase
    .from("signup_requests")
    .update({
      status: "rejected",
      decided_at: new Date().toISOString(),
      decided_by: org.userId,
    })
    .eq("id", requestId)
    .eq("status", "pending");

  revalidatePath("/settings/team");
}

export async function createDocCategory(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give the category a name." };

  const supabase = await createClient();
  const { error } = await supabase.from("doc_categories").insert({
    org_id: org.orgId,
    name,
    created_by: org.userId,
  });

  if (error) {
    return { error: error.code === "23505" ? "That category already exists." : error.message };
  }

  revalidatePath("/settings/docs");
  revalidatePath("/docs");
  return { error: null };
}

export async function deleteDocCategory(categoryId: string) {
  const org = await getCurrentOrg();
  if (!org) return;

  const supabase = await createClient();
  await supabase.from("doc_categories").delete().eq("id", categoryId);

  revalidatePath("/settings/docs");
  revalidatePath("/docs");
}
