import { redirect } from "next/navigation";
import { getCurrentClientPortalUser } from "@/lib/portal/getCurrentClientPortalUser";

export default async function ClientRootPage() {
  const clientUser = await getCurrentClientPortalUser();
  redirect(clientUser ? "/client/dashboard" : "/client/login");
}
