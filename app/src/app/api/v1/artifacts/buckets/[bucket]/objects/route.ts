import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApiKey, unauthorized } from "@/lib/api-keys/auth";
import { normalizeArtifactPrefix } from "@/lib/artifacts/keys";
import { prepareArtifactUpload } from "@/lib/artifacts/service";

const OBJECT_FIELDS =
  "id, key, version, is_latest, file_name, content_type, size_bytes, checksum_sha256, description, tags, client_id, uploaded_by, created_at";

async function findBucket(orgId: string, name: string) {
  const { data } = await createAdminClient()
    .from("artifact_buckets")
    .select("id, name")
    .eq("org_id", orgId)
    .eq("name", name)
    .maybeSingle();
  return data;
}

/**
 * GET /api/v1/artifacts/buckets/{bucket}/objects — like `cray artifacts list`.
 * Query: `prefix`, `client_id`, `all_versions=true`, `limit` (max 1000).
 */
export async function GET(request: Request, { params }: { params: Promise<{ bucket: string }> }) {
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();

  const { bucket: bucketName } = await params;
  const bucket = await findBucket(auth.orgId, bucketName);
  if (!bucket) return Response.json({ error: `Bucket "${bucketName}" not found.` }, { status: 404 });

  const url = new URL(request.url);
  const prefix = normalizeArtifactPrefix(url.searchParams.get("prefix") ?? "");
  const clientId = url.searchParams.get("client_id");
  const allVersions = url.searchParams.get("all_versions") === "true";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 1000, 1), 1000);

  let query = createAdminClient()
    .from("artifacts")
    .select(OBJECT_FIELDS)
    .eq("org_id", auth.orgId)
    .eq("bucket_id", bucket.id)
    .eq("status", "available")
    .order("key")
    .order("version", { ascending: false })
    .limit(limit);
  if (!allVersions) query = query.eq("is_latest", true);
  if (prefix) query = query.like("key", `${prefix.replace(/[\\%_]/g, "\\$&")}%`);
  if (clientId) query = query.eq("client_id", clientId);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ bucket: bucket.name, prefix, data });
}

/**
 * POST /api/v1/artifacts/buckets/{bucket}/objects — like `cray artifacts create`,
 * in two steps so large files never pass through this server:
 *   1. POST here with `{ key, content_type?, size_bytes?, checksum_sha256?,
 *      description?, tags?, client_id? }` → a pending artifact + `upload.signed_url`.
 *   2. PUT the raw bytes to `upload.signed_url` (valid 2 hours), then
 *      POST /api/v1/artifacts/objects/{id}/complete.
 */
export async function POST(request: Request, { params }: { params: Promise<{ bucket: string }> }) {
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();

  const { bucket: bucketName } = await params;
  const bucket = await findBucket(auth.orgId, bucketName);
  if (!bucket) return Response.json({ error: `Bucket "${bucketName}" not found.` }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  const input = body as Record<string, unknown>;
  if (typeof input.key !== "string") return Response.json({ error: "`key` is required." }, { status: 400 });

  const result = await prepareArtifactUpload(createAdminClient(), {
    orgId: auth.orgId,
    userId: null,
    bucketId: bucket.id,
    key: input.key,
    contentType: typeof input.content_type === "string" ? input.content_type : null,
    sizeBytes: typeof input.size_bytes === "number" ? input.size_bytes : null,
    checksumSha256: typeof input.checksum_sha256 === "string" ? input.checksum_sha256 : null,
    description: typeof input.description === "string" ? input.description : null,
    tags: Array.isArray(input.tags) || typeof input.tags === "string" ? (input.tags as string | string[]) : null,
    clientId: typeof input.client_id === "string" ? input.client_id : null,
  });
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });

  const { artifact, upload } = result.value;
  return Response.json(
    {
      data: { id: artifact.id, bucket: bucket.name, key: artifact.key, version: artifact.version, status: "pending" },
      upload: {
        method: "PUT",
        signed_url: upload.signedUrl,
        expires_in: 7200,
        complete_url: `/api/v1/artifacts/objects/${artifact.id}/complete`,
      },
    },
    { status: 201 }
  );
}
