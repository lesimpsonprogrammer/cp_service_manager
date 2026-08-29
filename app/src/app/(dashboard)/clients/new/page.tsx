import { PageHeader } from "@/components/ui/PageHeader";
import { ClientForm } from "@/components/clients/ClientForm";
import { createClientRecord } from "../actions";

export default function NewClientPage() {
  return (
    <div>
      <PageHeader title="Add a client" description="Store contact details and track their status." />
      <ClientForm action={createClientRecord} />
    </div>
  );
}
