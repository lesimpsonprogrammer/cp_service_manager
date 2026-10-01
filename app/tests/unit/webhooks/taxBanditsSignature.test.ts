import { describe, expect, it } from "vitest";
import { signTaxBanditsWebhook, verifyTaxBanditsWebhook } from "@/lib/webhooks/taxBanditsSignature";

describe("TaxBandits webhook signatures", () => {
  it("verifies the documented ClientId/newline/TimeStamp signature", () => {
    const signature = signTaxBanditsWebhook("client-id", "client-secret", "2026-10-01T13:45:00Z");
    expect(
      verifyTaxBanditsWebhook("client-id", "client-secret", "2026-10-01T13:45:00Z", signature)
    ).toBe(true);
  });

  it("rejects a signature created with another secret", () => {
    const signature = signTaxBanditsWebhook("client-id", "wrong-secret", "12345");
    expect(verifyTaxBanditsWebhook("client-id", "client-secret", "12345", signature)).toBe(false);
  });

  it("rejects missing TaxBandits headers", () => {
    expect(verifyTaxBanditsWebhook("client-id", "client-secret", null, null)).toBe(false);
  });
});
