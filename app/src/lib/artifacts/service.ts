import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import {
  ARTIFACTS_STORAGE_BUCKET,
  DEFAULT_DOWNLOAD_TTL_SECONDS,
  buildStoragePath,
  fileNameFromKey,
  normalizeArtifactKey,
  parseTags,
  type Result,
} from "./keys";

// Shared by the dashboard (server actions, RLS-scoped client) and the public
// API (/api/v1/artifacts, service-role client + explicit org filter). The
// `db` client decides who's allowed to touch rows; storage bytes are only
// ever reached through the service role, after a row check passes.

type Db = SupabaseClient<Database>;
export type ArtifactRow = Database["public"]["Tables"]["artifacts"]["Row"];

const PENDING_UPLOAD_TTL_MS = 24 * 60 * 60 * 1000;

function storage() {
  return createAdminClient().storage.from(ARTIFACTS_STORAGE_BUCKET);
}

export interface PrepareUploadInput {
  orgId: string;
  userId: string | null;
  bucketId: string;
  key: string;
  contentType?: string | null;
  sizeBytes?: number | null;
  checksumSha256?: string | null;
  description?: string | null;
  tags?: string | string[] | null;
  clientId?: string | null;
}

export interface PreparedUpload {
  artifact: Pick<ArtifactRow, "id" | "key" | "version" | "bucket_id" | "storage_path">;
  upload: { signedUrl: string; token: string; path: string };
}

/**
 * Step 1 of an upload: records a `pending` version and returns a signed URL
 * the caller uploads the bytes to directly (browser → Supabase Storage), which
 * sidesteps the serverless request-body limit for large payroll/export files.
 */
export async function prepareArtifactUpload(db: Db, input: PrepareUploadInput): Promise<Result<PreparedUpload>> {
  const keyResult = normalizeArtifactKey(input.key);
  if (!keyResult.ok) return keyResult;
  const key = keyResult.value;

  const { data: bucket } = await db
    .from("artifact_buckets")
    .select("id")
    .eq("id", input.bucketId)
    .eq("org_id", input.orgId)
    .maybeSingle();
  if (!bucket) return { ok: false, error: "Bucket not found." };

  const clientId = input.clientId || null;
  if (clientId) {
    const { data: client } = await db
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("org_id", input.orgId)
      .maybeSingle();
    if (!client) return { ok: false, error: "Client not found." };
  }

  const checksum = input.checksumSha256?.trim().toLowerCase() || null;
  if (checksum && !/^[0-9a-f]{64}$/.test(checksum)) {
    return { ok: false, error: "checksum_sha256 must be a 64-character hex SHA-256 digest." };
  }

  await cleanUpStalePendingUploads(db, input.orgId);

  const id = randomUUID();
  const fileName = fileNameFromKey(key);
  const storagePath = buildStoragePath(input.orgId, id, fileName);

  // Two attempts: a concurrent upload of the same key can take our version.
  let version = 0;
  let insertError: string | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data: latest } = await db
      .from("artifacts")
      .select("version")
      .eq("bucket_id", bucket.id)
      .eq("key", key)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    version = (latest?.version ?? 0) + 1;

    const { error } = await db.from("artifacts").insert({
      id,
      org_id: input.orgId,
      bucket_id: bucket.id,
      key,
      version,
      status: "pending",
      file_name: fileName,
      content_type: input.contentType?.trim() || "application/octet-stream",
      size_bytes: Math.max(0, Math.floor(Number(input.sizeBytes) || 0)),
      checksum_sha256: checksum,
      description: input.description?.trim() ?? "",
      tags: parseTags(input.tags),
      client_id: clientId,
      storage_path: storagePath,
      uploaded_by: input.userId,
    });

    insertError = error ? error.message : null;
    if (!error || error.code !== "23505") break;
  }
  if (insertError) return { ok: false, error: insertError };

  const { data: signed, error: signError } = await storage().createSignedUploadUrl(storagePath);
  if (signError || !signed) {
    await db.from("artifacts").delete().eq("id", id);
    return { ok: false, error: `Couldn't start the upload: ${signError?.message ?? "unknown storage error"}` };
  }

  return {
    ok: true,
    value: {
      artifact: { id, key, version, bucket_id: bucket.id, storage_path: storagePath },
      upload: { signedUrl: signed.signedUrl, token: signed.token, path: signed.path },
    },
  };
}

/**
 * Step 2 of an upload: confirms the bytes landed in storage, records the real
 * size/content type, and makes this the latest version of its key.
 */
export async function finalizeArtifactUpload(db: Db, orgId: string, artifactId: string): Promise<Result<ArtifactRow>> {
  const { data: artifact } = await db
    .from("artifacts")
    .select("*")
    .eq("id", artifactId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!artifact) return { ok: false, error: "Artifact not found." };
  if (artifact.status === "available") return { ok: true, value: artifact };

  const { data: info, error: infoError } = await storage().info(artifact.storage_path);
  if (infoError || !info) {
    return { ok: false, error: "The file hasn't reached storage yet — upload it to the signed URL first." };
  }

  const { data: updated, error } = await db
    .from("artifacts")
    .update({
      status: "available",
      size_bytes: typeof info.size === "number" ? info.size : artifact.size_bytes,
      content_type: info.contentType || artifact.content_type,
    })
    .eq("id", artifact.id)
    .select("*")
    .single();
  if (error || !updated) return { ok: false, error: error?.message ?? "Couldn't finalize the upload." };

  await refreshLatestVersion(db, updated.bucket_id, updated.key);
  return { ok: true, value: { ...updated, is_latest: await isLatest(db, updated.id) } };
}

/** Deletes one version. If it was the latest, the next-newest version takes over. */
export async function deleteArtifactVersion(db: Db, orgId: string, artifactId: string): Promise<Result<ArtifactRow>> {
  const { data: deleted, error } = await db
    .from("artifacts")
    .delete()
    .eq("id", artifactId)
    .eq("org_id", orgId)
    .select("*")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!deleted) return { ok: false, error: "Artifact not found, or you don't have permission to delete it." };

  await removeStorageObjects([deleted.storage_path]);
  await refreshLatestVersion(db, deleted.bucket_id, deleted.key);
  return { ok: true, value: deleted };
}

/** Deletes every version of a key. */
export async function deleteArtifactKey(db: Db, orgId: string, bucketId: string, key: string): Promise<Result<number>> {
  const { data: deleted, error } = await db
    .from("artifacts")
    .delete()
    .eq("org_id", orgId)
    .eq("bucket_id", bucketId)
    .eq("key", key)
    .select("storage_path");
  if (error) return { ok: false, error: error.message };
  if (!deleted || deleted.length === 0) {
    return { ok: false, error: "Artifact not found, or you don't have permission to delete it." };
  }

  await removeStorageObjects(deleted.map((row) => row.storage_path));
  return { ok: true, value: deleted.length };
}

/** Short-lived signed download URL. `ttlSeconds` doubles as a share-link expiry. */
export async function createArtifactDownloadUrl(
  artifact: Pick<ArtifactRow, "storage_path" | "file_name">,
  ttlSeconds: number = DEFAULT_DOWNLOAD_TTL_SECONDS
): Promise<Result<string>> {
  const { data, error } = await storage().createSignedUrl(artifact.storage_path, ttlSeconds, {
    download: artifact.file_name,
  });
  if (error || !data) return { ok: false, error: error?.message ?? "Couldn't create a download link." };
  return { ok: true, value: data.signedUrl };
}

async function refreshLatestVersion(db: Db, bucketId: string, key: string) {
  const { data: newest } = await db
    .from("artifacts")
    .select("id")
    .eq("bucket_id", bucketId)
    .eq("key", key)
    .eq("status", "available")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  await db.from("artifacts").update({ is_latest: false }).eq("bucket_id", bucketId).eq("key", key).eq("is_latest", true);
  if (newest) await db.from("artifacts").update({ is_latest: true }).eq("id", newest.id);
}

async function isLatest(db: Db, artifactId: string) {
  const { data } = await db.from("artifacts").select("is_latest").eq("id", artifactId).maybeSingle();
  return data?.is_latest ?? false;
}

async function removeStorageObjects(paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await storage().remove(paths);
  if (error) console.warn(`[artifacts] failed to remove ${paths.length} storage object(s): ${error.message}`);
}

/** Uploads that were started but never finished — drop them after a day. */
async function cleanUpStalePendingUploads(db: Db, orgId: string) {
  const cutoff = new Date(Date.now() - PENDING_UPLOAD_TTL_MS).toISOString();
  const { data: stale } = await db
    .from("artifacts")
    .delete()
    .eq("org_id", orgId)
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .select("storage_path");
  await removeStorageObjects((stale ?? []).map((row) => row.storage_path));
}

const PUBLIC_ARTIFACT_FIELDS = [
  "id",
  "bucket_id",
  "key",
  "version",
  "is_latest",
  "status",
  "file_name",
  "content_type",
  "size_bytes",
  "checksum_sha256",
  "description",
  "tags",
  "client_id",
  "uploaded_by",
  "created_at",
] as const;

export type PublicArtifact = Pick<ArtifactRow, (typeof PUBLIC_ARTIFACT_FIELDS)[number]>;

/** API response shape — never exposes the internal storage path. */
export function toPublicArtifact(row: ArtifactRow): PublicArtifact {
  return Object.fromEntries(PUBLIC_ARTIFACT_FIELDS.map((field) => [field, row[field]])) as PublicArtifact;
}
