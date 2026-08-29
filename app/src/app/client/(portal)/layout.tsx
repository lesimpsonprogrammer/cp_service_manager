import { redirect } from "next/navigation";
import { getCurrentClientPortalUser } from "@/lib/portal/getCurrentClientPortalUser";
import { ClientPortalSidebar } from "@/components/portal/ClientPortalSidebar";
import { ClientPortalTopbar } from "@/components/portal/ClientPortalTopbar";
import { InactivityLogout } from "@/components/auth/InactivityLogout";
import { signOutClient } from "@/app/client/actions";
import { isPasswordExpired } from "@/lib/utils/password";

export default async function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const clientUser = await getCurrentClientPortalUser();

  if (!clientUser) {
    redirect("/client/login");
  }

  if (isPasswordExpired(clientUser.passwordUpdatedAt)) {
    redirect("/client/reset-password");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <InactivityLogout onTimeout={signOutClient} />
      <ClientPortalSidebar clientName={clientUser.clientName} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <ClientPortalTopbar title={clientUser.clientName} userEmail={clientUser.userEmail} />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
