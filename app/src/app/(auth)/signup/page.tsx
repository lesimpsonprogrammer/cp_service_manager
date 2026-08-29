import { createAdminClient } from "@/lib/supabase/admin";
import { SignupForm } from "./SignupForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite: inviteToken } = await searchParams;

  let invite: { token: string; email: string; orgName: string } | null = null;

  if (inviteToken) {
    const admin = createAdminClient();
    const { data: inviteRow } = await admin
      .from("org_invites")
      .select("token, email, org_id, accepted_at, expires_at")
      .eq("token", inviteToken)
      .maybeSingle();

    if (inviteRow && !inviteRow.accepted_at && new Date(inviteRow.expires_at) > new Date()) {
      const { data: org } = await admin.from("organizations").select("name").eq("id", inviteRow.org_id).single();
      invite = { token: inviteRow.token, email: inviteRow.email, orgName: org?.name ?? "the workspace" };
    }
  }

  return <SignupForm invite={invite} />;
}
