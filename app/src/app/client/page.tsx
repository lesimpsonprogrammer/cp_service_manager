import { redirect } from "next/navigation";
import { getCurrentClientPortalUser } from "@/lib/portal/getCurrentClientPortalUser";
import { firstAccessiblePortalPath } from "@/lib/portal/permissions";

export default async function ClientRootPage() {
  const clientUser = await getCurrentClientPortalUser();
  redirect(clientUser ? firstAccessiblePortalPath(clientUser.role) : "/client/login");
}
