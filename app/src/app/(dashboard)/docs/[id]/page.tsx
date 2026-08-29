import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DeleteDocButton } from "@/components/docs/DeleteDocButton";
import { renderDocBody } from "@/lib/docs/markdown";

export default async function DocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: doc } = await supabase.from("docs").select("*").eq("id", id).single();

  if (!doc) notFound();

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {doc.title}
            <Badge tone="brand">{doc.category}</Badge>
          </span>
        }
        description={`Last updated ${new Date(doc.updated_at).toLocaleString()}`}
        action={
          <div className="flex items-center gap-2">
            <Link href={`/docs/${doc.id}/edit`}>
              <Button variant="secondary" size="sm">
                Edit
              </Button>
            </Link>
            <DeleteDocButton docId={doc.id} />
          </div>
        }
      />

      <Card className="max-w-3xl p-6">
        {doc.body.trim() ? (
          <div className="doc-content" dangerouslySetInnerHTML={{ __html: renderDocBody(doc.body) }} />
        ) : (
          <p className="text-sm text-muted">This doc is empty.</p>
        )}
      </Card>
    </div>
  );
}
