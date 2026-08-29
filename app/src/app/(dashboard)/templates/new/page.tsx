import { PageHeader } from "@/components/ui/PageHeader";
import { TemplateForm } from "@/components/templates/TemplateForm";
import { createTemplate } from "../actions";

export default function NewTemplatePage() {
  return (
    <div>
      <PageHeader
        title="New agreement template"
        description="Write the agreement text once. Placeholders get filled in per contract."
      />
      <TemplateForm action={createTemplate} />
    </div>
  );
}
