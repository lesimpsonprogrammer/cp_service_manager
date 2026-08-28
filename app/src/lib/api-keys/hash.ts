import { randomBytes, createHash } from "crypto";

export interface GeneratedApiKey {
  /** Shown to the user exactly once at creation time. Never persisted. */
  plaintext: string;
  /** Short, non-secret identifier safe to display in the UI later. */
  prefix: string;
  /** SHA-256 of the plaintext key, stored in `api_keys.key_hash`. */
  hash: string;
}

export function generateApiKey(): GeneratedApiKey {
  const secret = randomBytes(24).toString("base64url");
  const plaintext = `cpsm_live_${secret}`;
  return {
    plaintext,
    prefix: plaintext.slice(0, 14),
    hash: hashApiKey(plaintext),
  };
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}
