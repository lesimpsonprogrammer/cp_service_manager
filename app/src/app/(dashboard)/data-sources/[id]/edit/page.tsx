import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getConnectorDefinition } from "@/lib/connectors/registry";
import { PageHeader } from "@/components/ui/PageHeader";
import { EditDataSourceForm } from "@/components/connectors/EditDataSourceForm";

export default async function EditDataSourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: source } = await supabase.from("data_sources").select("*").eq("id", id).single();

  if (!source) notFound();

  const definition = getConnectorDefinition(source.type);
  if (!definition) notFound();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .order("name", { ascending: true });

  // Secret values (passwords, API keys) never leave the server — only their
  // presence is passed down, so the edit form can say "already set" without
  // shipping the actual value to the browser.
  const rawConfig = (source.config as Record<string, unknown>) ?? {};
  const config: Record<string, string> = {};
  const hasSecret: Record<string, boolean> = {};
  for (const field of definition.fields) {
    if (field.secret) {
      hasSecret[field.key] = rawConfig[field.key] !== undefined && rawConfig[field.key] !== "";
      continue;
    }
    if (rawConfig[field.key] !== undefined) config[field.key] = String(rawConfig[field.key]);
  }

  return (
    <div>
      <PageHeader title={`Edit ${source.name}`} description={definition.label} />
      <EditDataSourceForm
        dataSourceId={source.id}
        definition={definition}
        name={source.name}
        config={config}
        hasSecret={hasSecret}
        clients={clients ?? []}
        currentClientId={source.client_id}
      />
    </div>
  );
}
