"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ClientAuthActionState {
  error: string | null;
}

export async function signInClient(_prev: ClientAuthActionState, formData: FormData): Promise<ClientAuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const { data: membership } = await supabase
    .from("client_portal_users")
    .select("client_id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!membership) {
    await supabase.auth.signOut();
    return { error: "This account doesn't have client portal access." };
  }

  redirect("/client/dashboard");
}

export async function signOutClient() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/client/login");
}

export async function acceptClientInvite(
  _prev: ClientAuthActionState,
  formData: FormData
): Promise<ClientAuthActionState> {
  const token = String(formData.get("token") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!token || !email || !password) {
    return { error: "Missing invite details." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("client_portal_invites")
    .select("id, email, accepted_at, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (
    !invite ||
    invite.email.toLowerCase() !== email.toLowerCase() ||
    invite.accepted_at ||
    new Date(invite.expires_at) < new Date()
  ) {
    return { error: "This invite link is invalid, expired, or already used." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, client_invite_token: token },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/client/dashboard`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/client/login?welcome=1");
}
