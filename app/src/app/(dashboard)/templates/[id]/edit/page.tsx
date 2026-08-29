import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { TemplateForm } from "@/components/templates/TemplateForm";
import { updateTemplate } from "../../actions";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: template } = await supabase.from("agreement_templates").select("*").eq("id", id).single();

  if (!template) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${template.name}`} />
      <TemplateForm
        action={updateTemplate.bind(null, template.id)}
        template={template}
        submitLabel="Save changes"
        submitPendingLabel="Saving…"
      />
    </div>
  );
}
