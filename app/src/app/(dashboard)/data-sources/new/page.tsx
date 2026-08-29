import { PageHeader } from "@/components/ui/PageHeader";
import { NewDataSourceForm } from "@/components/connectors/NewDataSourceForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewDataSourcePage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <div>
      <PageHeader title="Add a data source" description="Pick a connector, then fill in its connection details." />
      <NewDataSourceForm clients={clients ?? []} />
    </div>
  );
}
