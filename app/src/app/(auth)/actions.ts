"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isFreeEmailDomain } from "@/lib/utils/email";
import { validatePasswordStrength } from "@/lib/utils/password";

export interface AuthActionState {
  error: string | null;
}

export async function signIn(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect(redirectTo || "/dashboard");
}

export async function signUp(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const inviteToken = String(formData.get("invite_token") ?? "").trim() || null;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return { error: passwordError };
  }

  if (!inviteToken && isFreeEmailDomain(email)) {
    return { error: "Use your work email to request access — personal addresses (Gmail, Yahoo, etc.) aren't accepted." };
  }

  // An invite link joins its org immediately; validate it up front so a
  // stale/foreign link fails with a clear message instead of the generic
  // Postgres error the `handle_new_user` trigger would otherwise raise.
  if (inviteToken) {
    const admin = createAdminClient();
    const { data: invite } = await admin
      .from("org_invites")
      .select("id, email, accepted_at, expires_at")
      .eq("token", inviteToken)
      .maybeSingle();

    if (
      !invite ||
      invite.email.toLowerCase() !== email.toLowerCase() ||
      invite.accepted_at ||
      new Date(invite.expires_at) < new Date()
    ) {
      return { error: "This invite link is invalid, expired, or already used." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, company_name: companyName, invite_token: inviteToken },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect(inviteToken ? "/login?checkEmail=1" : "/login?checkEmail=1&pendingApproval=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
