import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { DocForm } from "@/components/docs/DocForm";
import { updateDoc } from "../../actions";

export default async function EditDocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: doc } = await supabase.from("docs").select("*").eq("id", id).single();

  if (!doc) notFound();

  const { data: docs } = await supabase.from("docs").select("category");
  const categories = [...new Set((docs ?? []).map((d) => d.category))].sort();

  return (
    <div>
      <PageHeader title={`Edit ${doc.title}`} />
      <DocForm
        action={updateDoc.bind(null, doc.id)}
        doc={doc}
        categories={categories}
        submitLabel="Save changes"
        submitPendingLabel="Saving…"
      />
    </div>
  );
}
