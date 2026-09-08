import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { DocCategoriesPanel } from "@/components/settings/DocCategoriesPanel";

export default async function DocsSettingsPage() {
  const org = await getCurrentOrg();
  const supabase = await createClient();

  const { data: docCategories } = await supabase
    .from("doc_categories")
    .select("id, name")
    .eq("org_id", org?.orgId ?? "")
    .order("name", { ascending: true });

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title="Docs" description="The categories available when writing a doc." />

      <Card>
        <CardHeader>
          <CardTitle>Doc categories</CardTitle>
          <CardDescription>Shown as the groups in the Docs sidebar.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DocCategoriesPanel categories={docCategories ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
