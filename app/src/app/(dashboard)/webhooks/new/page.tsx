import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { NewWebhookForm } from "@/components/webhooks/NewWebhookForm";

export default async function NewWebhookPage() {
  const supabase = await createClient();
  const { data: dataSources } = await supabase.from("data_sources").select("id, name").order("name");

  return (
    <div>
      <PageHeader title="New webhook" />
      <NewWebhookForm dataSources={dataSources ?? []} />
    </div>
  );
}
