import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { DocForm } from "@/components/docs/DocForm";
import { createDoc } from "../actions";

export default async function NewDocPage() {
  const supabase = await createClient();
  const { data: docs } = await supabase.from("docs").select("category");
  const categories = [...new Set((docs ?? []).map((d) => d.category))].sort();

  return (
    <div>
      <PageHeader title="New doc" description="Written in Markdown — headings, lists, code blocks all work." />
      <DocForm action={createDoc} categories={categories} />
    </div>
  );
}
