import { createClient } from "@/lib/supabase/server";
import { DocsSidebar } from "@/components/docs/DocsSidebar";

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: docs } = await supabase
    .from("docs")
    .select("id, title, category")
    .order("title", { ascending: true });

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <DocsSidebar docs={docs ?? []} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
