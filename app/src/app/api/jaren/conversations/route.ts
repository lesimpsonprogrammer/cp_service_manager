import { authorize, checkMutationOrigin, readBoundedJson } from "@/lib/jaren/access-policy";
import { requireCpsmSession } from "@/lib/jaren/session";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await requireCpsmSession();
  if (access instanceof Response) return access;
  const denied = authorize(access, "chat", access.tenantId);
  if (denied) return denied;

  const status = new URL(request.url).searchParams.get("status") === "archived" ? "archived" : "active";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jaren_conversations")
    .select("id, title, status, updated_at")
    .eq("status", status)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) return Response.json({ error: "Could not load conversations." }, { status: 500 });
  return Response.json({ conversations: data }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const access = await requireCpsmSession();
  if (access instanceof Response) return access;
  const denied = authorize(access, "chat", access.tenantId);
  if (denied) return denied;
  const originDenied = checkMutationOrigin(request, process.env.NEXT_PUBLIC_APP_URL);
  if (originDenied) return originDenied;

  let title = "New conversation";
  try {
    const body = await readBoundedJson(request, 4 * 1024);
    if (body && typeof body === "object" && "title" in body && typeof (body as { title: unknown }).title === "string") {
      title = ((body as { title: string }).title || "New conversation").slice(0, 120);
    }
  } catch {
    // No body, or an empty one — the default title stands.
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jaren_conversations")
    .insert({ org_id: access.tenantId, user_id: access.userId, title })
    .select("id, title, status, updated_at")
    .single();

  if (error) return Response.json({ error: "Could not create conversation." }, { status: 500 });
  return Response.json({ conversation: data });
}
