import { createHmac, timingSafeEqual } from "crypto";

export function signTaxBanditsWebhook(clientId: string, clientSecret: string, timestamp: string): string {
  return createHmac("sha256", clientSecret)
    .update(`${clientId}\n${timestamp}`, "utf8")
    .digest("base64");
}

export function verifyTaxBanditsWebhook(
  clientId: string,
  clientSecret: string,
  timestamp: string | null,
  signature: string | null
): boolean {
  if (!timestamp || !signature) return false;
  const expected = Buffer.from(signTaxBanditsWebhook(clientId, clientSecret, timestamp), "utf8");
  const received = Buffer.from(signature.trim(), "utf8");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
