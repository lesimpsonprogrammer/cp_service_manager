import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function DocsPage() {
  const supabase = await createClient();
  const { data: docs } = await supabase
    .from("docs")
    .select("id, title, category, updated_at")
    .order("updated_at", { ascending: false });

  const docList = docs ?? [];
  const categories = new Map<string, typeof docList>();
  for (const doc of docList) {
    const list = categories.get(doc.category) ?? [];
    list.push(doc);
    categories.set(doc.category, list);
  }
  const sortedCategories = [...categories.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div>
      <PageHeader
        title="Docs"
        description="Internal documentation for developers and owners — setup steps, runbooks, anything worth writing down once."
        action={
          <Link href="/docs/new">
            <Button>+ New doc</Button>
          </Link>
        }
      />

      {sortedCategories.length > 0 ? (
        <div className="space-y-4">
          {sortedCategories.map(([category, items]) => (
            <Card key={category} className="overflow-hidden">
              <CardHeader>
                <CardTitle>{category}</CardTitle>
              </CardHeader>
              <ul className="divide-y divide-border">
                {items.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <Link href={`/docs/${doc.id}`} className="font-medium text-foreground hover:text-brand">
                      {doc.title}
                    </Link>
                    <span className="text-xs text-muted">
                      Updated {new Date(doc.updated_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="📚"
          title="No docs yet"
          description="Write down a setup step, a runbook, or a decision worth remembering — in Markdown."
          action={
            <Link href="/docs/new">
              <Button>Create your first doc</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
