import { authorize, checkMutationOrigin, readBoundedJson } from "@/lib/jaren/access-policy";
import { requireCpsmSession } from "@/lib/jaren/session";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireCpsmSession();
  if (access instanceof Response) return access;
  const denied = authorize(access, "chat", access.tenantId);
  if (denied) return denied;

  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jaren_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) return Response.json({ error: "Could not load messages." }, { status: 500 });
  return Response.json({ messages: data }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireCpsmSession();
  if (access instanceof Response) return access;
  const denied = authorize(access, "chat", access.tenantId);
  if (denied) return denied;
  const originDenied = checkMutationOrigin(request, process.env.NEXT_PUBLIC_APP_URL);
  if (originDenied) return originDenied;

  let body: { role?: unknown; content?: unknown };
  try {
    const parsed = await readBoundedJson(request, 128 * 1024);
    if (!parsed || typeof parsed !== "object") throw new Error("invalid-json");
    body = parsed as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if ((body.role !== "user" && body.role !== "assistant") || typeof body.content !== "string" || !body.content.trim()) {
    return Response.json({ error: "role ('user' | 'assistant') and non-empty content are required." }, { status: 400 });
  }

  const { id } = await params;
  const supabase = await createClient();

  const { count } = await supabase
    .from("jaren_messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", id);

  const { data, error } = await supabase
    .from("jaren_messages")
    .insert({ conversation_id: id, role: body.role, content: body.content })
    .select("id, role, content, created_at")
    .single();

  if (error) return Response.json({ error: "Could not save message." }, { status: 404 });

  const conversationUpdate: { updated_at: string; title?: string } = { updated_at: new Date().toISOString() };
  if (!count && body.role === "user") {
    conversationUpdate.title = body.content.trim().slice(0, 60);
  }
  await supabase.from("jaren_conversations").update(conversationUpdate).eq("id", id);

  return Response.json({ message: data });
}
