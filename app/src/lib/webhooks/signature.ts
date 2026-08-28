import { createHmac, timingSafeEqual } from "crypto";

export function signPayload(secret: string, rawBody: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function verifySignature(secret: string, rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = signPayload(secret, rawBody);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
