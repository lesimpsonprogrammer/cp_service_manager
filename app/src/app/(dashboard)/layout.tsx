import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const org = await getCurrentOrg();

  if (!org) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar orgName={org.orgName} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={org.orgName} userEmail={org.userEmail} role={org.role} />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
