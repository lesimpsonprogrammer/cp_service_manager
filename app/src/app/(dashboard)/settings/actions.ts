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

  revalidatePath("/settings");
  return { error: null };
}

export async function revokeInvite(inviteId: string) {
  const org = await getCurrentOrg();
  if (!org || !ADMIN_ROLES.has(org.role)) return;

  const supabase = await createClient();
  await supabase.from("org_invites").delete().eq("id", inviteId).is("accepted_at", null);

  revalidatePath("/settings");
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

  revalidatePath("/settings");
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

  revalidatePath("/settings");
}
