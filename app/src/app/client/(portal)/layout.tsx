import { redirect } from "next/navigation";
import { getCurrentClientPortalUser } from "@/lib/portal/getCurrentClientPortalUser";
import { ClientPortalSidebar } from "@/components/portal/ClientPortalSidebar";
import { ClientPortalTopbar } from "@/components/portal/ClientPortalTopbar";

export default async function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const clientUser = await getCurrentClientPortalUser();

  if (!clientUser) {
    redirect("/client/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <ClientPortalSidebar clientName={clientUser.clientName} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <ClientPortalTopbar title={clientUser.clientName} userEmail={clientUser.userEmail} />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
