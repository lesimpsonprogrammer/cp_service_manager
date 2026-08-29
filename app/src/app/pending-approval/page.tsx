import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";

export default async function PendingApprovalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membership) redirect("/dashboard");

  const { data: request } = await supabase
    .from("signup_requests")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  const rejected = request?.status === "rejected";

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-sm text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          {rejected ? "Access request declined" : "Awaiting approval"}
        </h2>
        <p className="mt-3 text-sm text-muted">
          {rejected
            ? `Your access request for ${user.email} was declined by a workspace admin.`
            : `Your account (${user.email}) is confirmed, but an admin still needs to approve your access before you can get in. You'll be able to sign in normally once that happens.`}
        </p>
        <form action={signOut} className="mt-6">
          <Button type="submit" variant="secondary" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
