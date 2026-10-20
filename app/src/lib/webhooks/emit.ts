import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchEvent } from "./dispatch";

// Reporting events (security, failed jobs and emails, SLA breaches) that a
// workspace can send to Global Security — or any other endpoint — by adding
// an outbound webhook for them on the Webhooks page. Delivery uses the same
// signed dispatch as every other webhook event and is logged in
// webhook_deliveries.
//
// Always best-effort: these run after the response where possible, use the
// service role (webhooks are admin-only under RLS, but any staff action can
// trigger a report), and never throw into the caller.

/** Runs `task` after the response when inside a request, otherwise right away. */
function defer(task: () => Promise<void>) {
  const safe = async () => {
    try {
      await task();
    } catch (err) {
      console.error("Webhook event failed:", err);
    }
  };
  try {
    after(safe);
  } catch {
    void safe();
  }
}

export function emitEvent(orgId: string, event: string, payload: Record<string, unknown>) {
  defer(() => dispatchEvent(createAdminClient(), orgId, event, payload));
}

/**
 * For events with no single workspace (a scheduled job or an email kind
 * failing): delivered to every workspace with an active webhook for it.
 */
export function emitSystemEvent(event: string, payload: Record<string, unknown>) {
  defer(async () => {
    const admin = createAdminClient();
    const { data: hooks } = await admin
      .from("webhooks")
      .select("org_id")
      .eq("direction", "outbound")
      .eq("is_active", true)
      .contains("events", [event]);
    const orgIds = Array.from(new Set((hooks ?? []).map((h) => h.org_id)));
    await Promise.all(orgIds.map((orgId) => dispatchEvent(admin, orgId, event, payload)));
  });
}

/**
 * Wraps a cron job so Global Security hears when it fails and when it
 * recovers. `failureOf` lets a job that returns its errors (rather than
 * throwing) still count as failed.
 */
export async function reportJob<T>(job: string, run: () => Promise<T>, failureOf?: (result: T) => string | null): Promise<T> {
  try {
    const result = await run();
    const failure = failureOf?.(result) ?? null;
    if (failure) emitSystemEvent("system.job.failed", { job, error: failure.slice(0, 1000) });
    else emitSystemEvent("system.job.succeeded", { job });
    return result;
  } catch (err) {
    emitSystemEvent("system.job.failed", { job, error: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}

/** Called from every Resend error path; grouped by email kind on the receiving side. */
export function reportEmailFailure(kind: string, error: unknown) {
  const message =
    error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : String(error);
  emitSystemEvent("system.email.failed", { kind, error: message.slice(0, 500) });
}
