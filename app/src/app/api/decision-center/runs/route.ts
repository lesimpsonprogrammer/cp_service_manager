import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { createAdminClient } from "@/lib/supabase/admin";
import { decisionSubmissionSchema } from "@/lib/decision-engine/scenarios";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const roles = new Set(["owner", "admin"]);
const fields = "id,name,engine,status,scenario,response,error,created_at,finished_at";
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function readBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Invalid JSON.");
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > 65_536) { await reader.cancel(); throw new Error("Request too large."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function GET(request: Request) {
  const org = await getCurrentOrg();
  if (!org) return json({ error: "Sign in to view decision runs." }, 401);
  if (!roles.has(org.role)) return json({ error: "Organization administrator access is required." }, 403);
  const id = new URL(request.url).searchParams.get("id");
  if (id && !z.string().uuid().safeParse(id).success) return json({ error: "Invalid run ID." }, 400);
  const db = createAdminClient();
  if (id) {
    const { data, error } = await db.from("decision_runs").select(fields).eq("org_id", org.orgId).eq("id", id).maybeSingle();
    if (error) return json({ error: "Run history is unavailable. Confirm that the Decision Center database migration has been applied." }, 503);
    return data ? json({ run: data }) : json({ error: "Run not found." }, 404);
  }
  const { data, error } = await db.from("decision_runs").select("id,name,engine,status,created_at,finished_at").eq("org_id", org.orgId).order("created_at", { ascending: false }).limit(25);
  if (error) return json({ error: "Run history needs database setup or is temporarily unavailable." }, 503);
  return json({ runs: data });
}

export async function POST(request: Request) {
  const org = await getCurrentOrg();
  if (!org) return json({ error: "Sign in to run a scenario." }, 401);
  if (!roles.has(org.role)) return json({ error: "Organization administrator access is required." }, 403);
  // Cookie authentication: reject cross-origin writes before allocating work.
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "Invalid request origin." }, 403);
  let body: unknown;
  try { body = await readBody(request); } catch (error) {
    return json({ error: error instanceof Error && error.message === "Request too large." ? error.message : "Enter valid JSON." }, error instanceof Error && error.message === "Request too large." ? 413 : 400);
  }
  const parsed = decisionSubmissionSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.issues.map(issue => `${issue.path.join(".") || "Scenario"}: ${issue.message}`).join(" ") }, 400);
  const input = parsed.data;
  const db = createAdminClient();
  const { data: previous, error: lookupError } = await db.from("decision_runs").select(fields).eq("org_id", org.orgId).eq("id", input.requestId).maybeSingle();
  if (lookupError) return json({ error: "History storage needs setup or is unavailable. The run was not started." }, 503);
  if (previous) return json({ run: previous, saved: true, error: ["queued", "running"].includes(previous.status) ? "This run is already in progress. Refresh history; do not submit it again." : undefined }, ["queued", "running"].includes(previous.status) ? 409 : 200);
  const { count, error: countError } = await db.from("decision_runs").select("id", { count: "exact", head: true }).eq("org_id", org.orgId).gte("created_at", new Date(Date.now() - 3_600_000).toISOString());
  if (countError) return json({ error: "Run history is unavailable. The run was not started." }, 503);
  if ((count ?? 0) >= 60) return json({ error: "This organization has reached 60 runs in the last hour. Try again later." }, 429);
  const { error: insertError } = await db.from("decision_runs").insert({ id: input.requestId, org_id: org.orgId, created_by: org.userId, name: input.name, engine: input.engine, scenario: input.scenario, status: "queued" });
  if (insertError) return json({ error: insertError.code === "23505" ? "This run was already submitted. Refresh history." : "The run could not be saved and was not started." }, insertError.code === "23505" ? 409 : 503);
  return json({ run: { id: input.requestId, name: input.name, engine: input.engine, scenario: input.scenario, status: "queued", response: null, error: null, created_at: new Date().toISOString(), finished_at: null }, saved: true }, 202);
}
