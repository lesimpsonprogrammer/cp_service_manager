import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeleteTemplateButton } from "@/components/templates/DeleteTemplateButton";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("agreement_templates")
    .select("id, name, updated_at")
    .order("name", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Agreement templates"
        description="Reusable contract text with placeholders, so you're not retyping boilerplate for every client."
        action={
          <Link href="/templates/new">
            <Button>+ New template</Button>
          </Link>
        }
      />

      {templates && templates.length > 0 ? (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border">
            {templates.map((template) => (
              <li key={template.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <Link href={`/templates/${template.id}/edit`} className="font-medium text-foreground hover:text-brand">
                  {template.name}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">
                    Updated {new Date(template.updated_at).toLocaleDateString()}
                  </span>
                  <Link href={`/templates/${template.id}/edit`} className="text-xs text-brand hover:underline">
                    Edit
                  </Link>
                  <DeleteTemplateButton templateId={template.id} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <EmptyState
          icon="📄"
          title="No templates yet"
          description="Add your standard agreement text once, then pick it when creating a contract for any client."
          action={
            <Link href="/templates/new">
              <Button>Create your first template</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
