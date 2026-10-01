import { createAdminClient } from "@/lib/supabase/admin";
import { verifySignature } from "@/lib/webhooks/signature";
import { verifyTaxBanditsWebhook } from "@/lib/webhooks/taxBanditsSignature";

/**
 * Public inbound webhook receiver. Not protected by Supabase auth — the
 * per-webhook `inbound_token` in the URL plus the HMAC signature header are
 * the credential. Uses the admin client because the caller is an external
 * system with no Supabase session.
 */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: webhook } = await admin
    .from("webhooks")
    .select("id, org_id, secret, is_active, data_source_id")
    .eq("inbound_token", token)
    .eq("direction", "inbound")
    .maybeSingle();

  if (!webhook || !webhook.is_active) {
    return Response.json({ error: "Webhook not found." }, { status: 404 });
  }

  const rawBody = await request.text();
  let valid = false;
  let signatureError = "Invalid or missing X-CPSM-Signature header.";

  if (webhook.data_source_id) {
    const { data: dataSource } = await admin
      .from("data_sources")
      .select("type, config")
      .eq("id", webhook.data_source_id)
      .maybeSingle();

    if (dataSource?.type === "tax_filing") {
      const config = (dataSource.config ?? {}) as Record<string, unknown>;
      valid = verifyTaxBanditsWebhook(
        String(config.client_id ?? ""),
        String(config.client_secret ?? ""),
        request.headers.get("timestamp"),
        request.headers.get("signature")
      );
      signatureError = "Invalid or missing TaxBandits Signature/TimeStamp headers.";
    } else {
      valid = verifySignature(webhook.secret, rawBody, request.headers.get("x-cpsm-signature"));
    }
  } else {
    valid = verifySignature(webhook.secret, rawBody, request.headers.get("x-cpsm-signature"));
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    // Non-JSON bodies are still logged for inspection below.
    payload = { raw: rawBody };
  }

  await admin.from("webhook_deliveries").insert({
    webhook_id: webhook.id,
    org_id: webhook.org_id,
    event: typeof payload.event === "string" ? payload.event : "inbound.push",
    direction: "inbound",
    payload,
    success: valid,
    error: valid ? null : signatureError,
  });

  if (!valid) {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }

  if (webhook.data_source_id) {
    await admin
      .from("data_sources")
      .update({ status: "connected", last_synced_at: new Date().toISOString() })
      .eq("id", webhook.data_source_id);
  }

  return Response.json({ ok: true });
}
