import { describe, expect, it } from "vitest";
import { signPayload, verifySignature } from "@/lib/webhooks/signature";

describe("webhook signatures", () => {
  it("verifies a signature produced by signPayload", () => {
    const secret = "shh";
    const body = JSON.stringify({ hello: "world" });
    const signature = signPayload(secret, body);
    expect(verifySignature(secret, body, signature)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const secret = "shh";
    const signature = signPayload(secret, JSON.stringify({ hello: "world" }));
    expect(verifySignature(secret, JSON.stringify({ hello: "mallory" }), signature)).toBe(false);
  });

  it("rejects a missing signature", () => {
    expect(verifySignature("shh", "{}", null)).toBe(false);
  });

  it("rejects a signature from the wrong secret", () => {
    const signature = signPayload("secret-a", "{}");
    expect(verifySignature("secret-b", "{}", signature)).toBe(false);
  });
});
