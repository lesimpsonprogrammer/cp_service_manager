import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApiKey, unauthorized } from "@/lib/api-keys/auth";
import { DEFAULT_DOWNLOAD_TTL_SECONDS } from "@/lib/artifacts/keys";
import { createArtifactDownloadUrl, deleteArtifactVersion, toPublicArtifact } from "@/lib/artifacts/service";

const DOWNLOAD_URL_TTL_SECONDS = 5 * 60;

/**
 * GET /api/v1/artifacts/objects/{id} — like `cray artifacts describe`, plus a
 * 5-minute `download_url`. Add `?redirect=true` to be sent straight to the
 * file (like `cray artifacts get`): `curl -L -o out.xlsx ...?redirect=true`.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();

  const { id } = await params;
  const { data: artifact } = await createAdminClient()
    .from("artifacts")
    .select("*, artifact_buckets ( name )")
    .eq("id", id)
    .eq("org_id", auth.orgId)
    .maybeSingle();
  if (!artifact) return Response.json({ error: "Artifact not found." }, { status: 404 });

  const { artifact_buckets: bucket, ...row } = artifact;
  const fields = toPublicArtifact(row);
  const bucketName = (bucket as { name: string } | null)?.name ?? null;

  if (artifact.status !== "available") {
    return Response.json({ data: { ...fields, bucket: bucketName }, download_url: null });
  }

  const redirect = new URL(request.url).searchParams.get("redirect") === "true";
  const url = await createArtifactDownloadUrl(
    artifact,
    redirect ? DEFAULT_DOWNLOAD_TTL_SECONDS : DOWNLOAD_URL_TTL_SECONDS
  );
  if (!url.ok) return Response.json({ error: url.error }, { status: 502 });
  if (redirect) return Response.redirect(url.value, 302);

  return Response.json({
    data: { ...fields, bucket: bucketName },
    download_url: url.value,
    download_url_expires_in: DOWNLOAD_URL_TTL_SECONDS,
  });
}

/** DELETE /api/v1/artifacts/objects/{id} — like `cray artifacts delete` (one version). */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();

  const { id } = await params;
  const result = await deleteArtifactVersion(createAdminClient(), auth.orgId, id);
  if (!result.ok) return Response.json({ error: result.error }, { status: 404 });
  return Response.json({ data: { id: result.value.id, key: result.value.key, version: result.value.version, deleted: true } });
}
