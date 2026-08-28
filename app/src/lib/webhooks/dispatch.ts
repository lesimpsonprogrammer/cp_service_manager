import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { signPayload } from "./signature";

/**
 * Delivers `event` to every active outbound webhook in `orgId` subscribed to
 * it. Fire-and-forget from the caller's perspective — failures are logged to
 * `webhook_deliveries`, not thrown, so a broken customer endpoint never
 * breaks the pipeline run that triggered it.
 */
export async function dispatchEvent(
  supabase: SupabaseClient<Database>,
  orgId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const { data: webhooks } = await supabase
    .from("webhooks")
    .select("id, target_url, secret, events")
    .eq("org_id", orgId)
    .eq("direction", "outbound")
    .eq("is_active", true);

  const subscribed = (webhooks ?? []).filter((w) => w.events?.includes(event));
  if (subscribed.length === 0) return;

  const body = JSON.stringify({ event, data: payload, sent_at: new Date().toISOString() });

  await Promise.all(
    subscribed.map(async (webhook) => {
      let responseStatus: number | null = null;
      let success = false;
      let error: string | null = null;

      try {
        if (!webhook.target_url) throw new Error("No target URL configured.");
        const signature = signPayload(webhook.secret, body);
        const res = await fetch(webhook.target_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CPSM-Event": event,
            "X-CPSM-Signature": signature,
          },
          body,
        });
        responseStatus = res.status;
        success = res.ok;
        if (!res.ok) error = `Endpoint responded with ${res.status}`;
      } catch (err) {
        error = err instanceof Error ? err.message : "Delivery failed.";
      }

      await supabase.from("webhook_deliveries").insert({
        webhook_id: webhook.id,
        org_id: orgId,
        event,
        direction: "outbound",
        payload,
        response_status: responseStatus,
        success,
        error,
      });
    })
  );
}
