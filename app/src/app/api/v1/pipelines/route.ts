import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApiKey, unauthorized } from "@/lib/api-keys/auth";

export async function GET(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pipelines")
    .select("id, name, source_id, destination_id, schedule, is_active, created_at")
    .eq("org_id", auth.orgId)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}
