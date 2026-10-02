import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApiKey, unauthorized } from "@/lib/api-keys/auth";

/** GET /api/v1/artifacts/buckets — like `cray artifacts buckets list`. */
export async function GET(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();

  const admin = createAdminClient();
  const [{ data: buckets, error }, { data: stats }] = await Promise.all([
    admin
      .from("artifact_buckets")
      .select("id, name, description, is_system, created_at")
      .eq("org_id", auth.orgId)
      .order("name"),
    admin.from("artifact_bucket_stats").select("*").eq("org_id", auth.orgId),
  ]);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const statsByBucket = new Map((stats ?? []).map((s) => [s.bucket_id, s]));
  const data = (buckets ?? []).map((bucket) => {
    const s = statsByBucket.get(bucket.id);
    return {
      ...bucket,
      object_count: Number(s?.object_count ?? 0),
      version_count: Number(s?.version_count ?? 0),
      total_bytes: Number(s?.total_bytes ?? 0),
      last_upload_at: s?.last_upload_at ?? null,
    };
  });
  return Response.json({ data });
}
