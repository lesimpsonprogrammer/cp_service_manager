import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileSidebarProvider } from "@/components/layout/MobileSidebarContext";
import { InactivityLogout } from "@/components/auth/InactivityLogout";
import { signOut } from "@/app/(auth)/actions";
import { isPasswordExpired } from "@/lib/utils/password";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const org = await getCurrentOrg();

  if (!org) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // Signed in but no org membership yet: either awaiting admin approval
    // (see `signup_requests`) or declined — either way, not "logged out".
    redirect(user ? "/pending-approval" : "/login");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("password_updated_at")
    .eq("id", org.userId)
    .maybeSingle();

  if (profile && isPasswordExpired(profile.password_updated_at)) {
    redirect("/reset-password");
  }

  return (
    <MobileSidebarProvider>
      <div className="flex h-screen overflow-hidden bg-canvas">
        <InactivityLogout onTimeout={signOut} />
        <Sidebar orgName={org.orgName} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar title={org.orgName} userEmail={org.userEmail} role={org.role} />
          <main className="scrollbar-thin flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </MobileSidebarProvider>
  );
}
