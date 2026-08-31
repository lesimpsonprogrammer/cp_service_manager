import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { DocForm } from "@/components/docs/DocForm";
import { createDoc } from "../actions";

export default async function NewDocPage() {
  const supabase = await createClient();
  const { data: docCategories } = await supabase.from("doc_categories").select("name").order("name", { ascending: true });
  const categories = (docCategories ?? []).map((c) => c.name);

  return (
    <div>
      <PageHeader title="New doc" description="Written in Markdown — headings, lists, code blocks all work." />
      <DocForm action={createDoc} categories={categories} />
    </div>
  );
}
