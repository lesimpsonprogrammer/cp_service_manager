import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArtifactTable, ARTIFACT_LIST_SELECT, type ArtifactListItem } from "@/components/artifacts/ArtifactTable";

export default async function ClientArtifactsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: artifacts } = await supabase
    .from("artifacts")
    .select(ARTIFACT_LIST_SELECT)
    .eq("client_id", id)
    .eq("is_latest", true)
    .order("created_at", { ascending: false })
    .limit(500);

  const items = (artifacts ?? []) as unknown as ArtifactListItem[];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Artifacts for this client</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length > 0 ? (
          <ArtifactTable items={items} showClient={false} />
        ) : (
          <p className="px-5 py-4 text-sm text-muted">
            No artifacts are linked to this client yet. Pick this client when you{" "}
            <Link href="/artifacts" className="text-brand hover:underline">
              upload an artifact
            </Link>
            .
          </p>
        )}
      </CardContent>
    </Card>
  );
}
