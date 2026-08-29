import { PageHeader } from "@/components/ui/PageHeader";
import { ClientForm } from "@/components/clients/ClientForm";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { getOrgMembers } from "@/lib/org/getOrgMembers";
import { createClientRecord } from "../actions";

export default async function NewClientPage() {
  const org = await getCurrentOrg();
  const orgMembers = org ? await getOrgMembers(org.orgId) : [];

  return (
    <div>
      <PageHeader title="Add a client" description="Store contact details and track their status." />
      <ClientForm action={createClientRecord} orgMembers={orgMembers} />
    </div>
  );
}
