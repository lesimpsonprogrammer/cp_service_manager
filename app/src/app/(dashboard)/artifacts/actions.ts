"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { normalizeBucketName, SHARE_LINK_TTLS, type Result } from "@/lib/artifacts/keys";
import {
  createArtifactDownloadUrl,
  deleteArtifactKey,
  deleteArtifactVersion,
  finalizeArtifactUpload,
  prepareArtifactUpload,
  type PreparedUpload,
} from "@/lib/artifacts/service";

const ADMIN_ROLES = new Set(["owner", "admin", "sys_admin"]);

export interface BucketFormState {
  error: string | null;
}

export async function createBucket(_prev: BucketFormState, formData: FormData): Promise<BucketFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };
  if (!ADMIN_ROLES.has(org.role)) return { error: "Only owners and admins can create buckets." };

  const name = normalizeBucketName(String(formData.get("name") ?? ""));
  if (!name.ok) return { error: name.error };
  const description = String(formData.get("description") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("artifact_buckets")
    .insert({ org_id: org.orgId, name: name.value, description, created_by: org.userId });

  if (error) {
    return { error: error.code === "23505" ? `A bucket named "${name.value}" already exists.` : error.message };
  }

  revalidatePath("/artifacts");
  redirect(`/artifacts/${name.value}`);
}

export async function deleteBucket(bucketId: string): Promise<Result<null>> {
  const org = await getCurrentOrg();
  if (!org) return { ok: false, error: "Not signed in." };
  if (!ADMIN_ROLES.has(org.role)) return { ok: false, error: "Only owners and admins can delete buckets." };

  const supabase = await createClient();
  const { data: bucket } = await supabase
    .from("artifact_buckets")
    .select("id, is_system")
    .eq("id", bucketId)
    .maybeSingle();
  if (!bucket) return { ok: false, error: "Bucket not found." };
  if (bucket.is_system) return { ok: false, error: "System buckets can't be deleted." };

  const { count } = await supabase
    .from("artifacts")
    .select("id", { count: "exact", head: true })
    .eq("bucket_id", bucketId);
  if (count) return { ok: false, error: "Delete the artifacts in this bucket first." };

  const { error } = await supabase.from("artifact_buckets").delete().eq("id", bucketId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/artifacts");
  redirect("/artifacts");
}

export interface PrepareUploadRequest {
  bucketId: string;
  key: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string | null;
  description: string;
  tags: string;
  clientId: string | null;
}

export async function prepareUpload(request: PrepareUploadRequest): Promise<Result<PreparedUpload>> {
  const org = await getCurrentOrg();
  if (!org) return { ok: false, error: "Not signed in." };
  if (org.role === "viewer") return { ok: false, error: "Viewers can't upload artifacts." };

  const supabase = await createClient();
  return prepareArtifactUpload(supabase, { ...request, orgId: org.orgId, userId: org.userId });
}

export async function finalizeUpload(artifactId: string): Promise<Result<{ id: string }>> {
  const org = await getCurrentOrg();
  if (!org) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const result = await finalizeArtifactUpload(supabase, org.orgId, artifactId);
  if (!result.ok) return result;

  revalidatePath("/artifacts", "layout");
  if (result.value.client_id) revalidatePath(`/clients/${result.value.client_id}/artifacts`);
  return { ok: true, value: { id: result.value.id } };
}

export async function deleteVersion(artifactId: string, bucketName: string): Promise<Result<null>> {
  const org = await getCurrentOrg();
  if (!org) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const result = await deleteArtifactVersion(supabase, org.orgId, artifactId);
  if (!result.ok) return result;

  revalidatePath("/artifacts", "layout");

  // Land on whichever version is now the latest for this key, if any.
  const { data: next } = await supabase
    .from("artifacts")
    .select("id")
    .eq("bucket_id", result.value.bucket_id)
    .eq("key", result.value.key)
    .eq("is_latest", true)
    .maybeSingle();
  redirect(next ? `/artifacts/${bucketName}/${next.id}` : `/artifacts/${bucketName}`);
}

export async function deleteAllVersions(bucketId: string, key: string, bucketName: string): Promise<Result<null>> {
  const org = await getCurrentOrg();
  if (!org) return { ok: false, error: "Not signed in." };

  const supabase = await createClient();
  const result = await deleteArtifactKey(supabase, org.orgId, bucketId, key);
  if (!result.ok) return result;

  revalidatePath("/artifacts", "layout");
  redirect(`/artifacts/${bucketName}`);
}

/** CSM's "temporary S3 credentials", scoped down to one file: an expiring link. */
export async function createShareLink(artifactId: string, ttlSeconds: number): Promise<Result<string>> {
  const org = await getCurrentOrg();
  if (!org) return { ok: false, error: "Not signed in." };
  if (org.role === "viewer") return { ok: false, error: "Viewers can't create share links." };
  if (!SHARE_LINK_TTLS.some((ttl) => ttl.seconds === ttlSeconds)) return { ok: false, error: "Pick a link expiry." };

  const supabase = await createClient();
  const { data: artifact } = await supabase
    .from("artifacts")
    .select("storage_path, file_name, status")
    .eq("id", artifactId)
    .eq("org_id", org.orgId)
    .maybeSingle();
  if (!artifact || artifact.status !== "available") return { ok: false, error: "Artifact not found." };

  return createArtifactDownloadUrl(artifact, ttlSeconds);
}
