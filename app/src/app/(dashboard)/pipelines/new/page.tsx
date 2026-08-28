import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { PipelineBuilderForm } from "@/components/pipelines/PipelineBuilderForm";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function NewPipelinePage() {
  const supabase = await createClient();
  const { data: dataSources } = await supabase
    .from("data_sources")
    .select("id, name, type")
    .order("created_at", { ascending: false });

  if (!dataSources || dataSources.length === 0) {
    return (
      <div>
        <PageHeader title="New pipeline" />
        <EmptyState
          icon="⇄"
          title="Add a data source first"
          description="Pipelines move data between connectors — connect at least one source before building a pipeline."
          action={
            <Link href="/data-sources/new">
              <Button>Add a data source</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="New pipeline" description="Choose a source, map fields, and optionally send output to a destination." />
      <PipelineBuilderForm dataSources={dataSources} />
    </div>
  );
}
