import { PageHeader } from "@/components/ui/PageHeader";
import { DocForm } from "@/components/docs/DocForm";
import { createDoc } from "../actions";

export default function NewDocPage() {
  return (
    <div>
      <PageHeader title="New doc" description="Written in Markdown — headings, lists, code blocks all work." />
      <DocForm action={createDoc} />
    </div>
  );
}
