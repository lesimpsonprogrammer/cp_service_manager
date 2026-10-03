import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createArtifactDownloadUrl } from "@/lib/artifacts/service";

// Dashboard download (session cookie auth). The RLS-scoped select is the
// membership check; the bytes come from a 60-second signed URL.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { data: artifact } = await supabase
    .from("artifacts")
    .select("storage_path, file_name, status")
    .eq("id", id)
    .maybeSingle();
  if (!artifact || artifact.status !== "available") {
    return NextResponse.json({ error: "Artifact not found." }, { status: 404 });
  }

  const url = await createArtifactDownloadUrl(artifact);
  if (!url.ok) return NextResponse.json({ error: url.error }, { status: 502 });
  return NextResponse.redirect(url.value);
}
