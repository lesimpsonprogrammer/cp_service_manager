import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApiKey, unauthorized } from "@/lib/api-keys/auth";
import { runPipeline } from "@/lib/etl/engine";

// See the matching comment in (dashboard)/pipelines/actions.ts — without
// this, a slow extract/load gets killed by Vercel's default timeout before
// the run row is ever marked succeeded/failed, and it's stuck on "running".
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();

  const admin = createAdminClient();
  const { data: pipeline, error } = await admin
    .from("pipelines")
    .select("id, org_id, source_id, destination_id, mapping, transform_steps")
    .eq("id", id)
    .eq("org_id", auth.orgId)
    .single();

  if (error || !pipeline) {
    return Response.json({ error: "Pipeline not found." }, { status: 404 });
  }

  try {
    const result = await runPipeline(admin, pipeline, "api");
    return Response.json({ data: result });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Run failed." }, { status: 500 });
  }
}
