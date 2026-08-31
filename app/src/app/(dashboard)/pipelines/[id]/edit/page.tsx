import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { EditPipelineForm } from "@/components/pipelines/EditPipelineForm";
import type { FieldMapping, TransformStep } from "@/lib/etl/transforms";

export default async function EditPipelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: pipeline } = await supabase.from("pipelines").select("*").eq("id", id).single();

  if (!pipeline) notFound();

  const { data: dataSources } = await supabase
    .from("data_sources")
    .select("id, name, type")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl">
      <PageHeader title={`Edit ${pipeline.name}`} description="Change the source, destination, field mapping, or transform steps." />
      <EditPipelineForm
        pipelineId={pipeline.id}
        dataSources={dataSources ?? []}
        initialName={pipeline.name}
        initialSourceId={pipeline.source_id}
        initialDestinationId={pipeline.destination_id}
        initialSchedule={pipeline.schedule}
        initialMapping={(pipeline.mapping ?? []) as FieldMapping[]}
        initialSteps={(pipeline.transform_steps ?? []) as unknown as TransformStep[]}
      />
    </div>
  );
}
