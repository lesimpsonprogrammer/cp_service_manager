import { authorize, checkMutationOrigin, readBoundedJson } from "@/lib/jaren/access-policy";
import { requireCpsmSession } from "@/lib/jaren/session";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireCpsmSession();
  if (access instanceof Response) return access;
  const denied = authorize(access, "chat", access.tenantId);
  if (denied) return denied;
  const originDenied = checkMutationOrigin(request, process.env.NEXT_PUBLIC_APP_URL);
  if (originDenied) return originDenied;

  let body: { status?: unknown; title?: unknown };
  try {
    const parsed = await readBoundedJson(request, 4 * 1024);
    if (!parsed || typeof parsed !== "object") throw new Error("invalid-json");
    body = parsed as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const update: { status?: "active" | "archived"; title?: string } = {};
  if (body.status === "active" || body.status === "archived") update.status = body.status;
  if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim().slice(0, 120);
  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jaren_conversations")
    .update(update)
    .eq("id", id)
    .select("id, title, status, updated_at")
    .single();

  if (error) return Response.json({ error: "Could not update conversation." }, { status: 404 });
  return Response.json({ conversation: data });
}
