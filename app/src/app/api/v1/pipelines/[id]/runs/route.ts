import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApiKey, unauthorized } from "@/lib/api-keys/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pipeline_runs")
    .select("*")
    .eq("pipeline_id", id)
    .eq("org_id", auth.orgId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}
