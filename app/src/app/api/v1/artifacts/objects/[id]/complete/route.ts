import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateApiKey, unauthorized } from "@/lib/api-keys/auth";
import { finalizeArtifactUpload, toPublicArtifact } from "@/lib/artifacts/service";

/** POST /api/v1/artifacts/objects/{id}/complete — finish a signed-URL upload. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();

  const { id } = await params;
  const result = await finalizeArtifactUpload(createAdminClient(), auth.orgId, id);
  if (!result.ok) return Response.json({ error: result.error }, { status: 409 });

  return Response.json({ data: toPublicArtifact(result.value) });
}
