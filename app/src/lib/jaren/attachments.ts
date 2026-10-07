// Screenshots in Jaren chat. Images travel inside the chat request as data URLs
// (nothing is stored), so the limits below keep a request under Vercel's 4.5 MB
// function body limit.

export const JAREN_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
export const MAX_IMAGES_PER_MESSAGE = 4;
// Decoded bytes per image; the browser shrinks screenshots to fit. Four of these,
// base64-encoded, still fit inside HISTORY_IMAGE_BUDGET.
export const MAX_IMAGE_BYTES = 640 * 1024;
// Whole chat request. Kept under the 4.5 MB platform limit with room for JSON.
export const CHAT_BODY_LIMIT = 4 * 1024 * 1024;
// Image data (as data-URL characters) resent with each turn. Older screenshots
// beyond this are swapped for a short note so long chats keep working.
export const HISTORY_IMAGE_BUDGET = 3.5 * 1024 * 1024;
export const EARLIER_SCREENSHOT_NOTE = "[A screenshot shared earlier in this chat is no longer attached.]";

const DATA_URL = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/;

type Part = { type?: unknown; mediaType?: unknown; url?: unknown };
type Message = { role?: unknown; parts?: unknown };

function decodedBytes(base64: string) {
  return Math.floor((base64.length * 3) / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
}

/** Returns a reason the request's attachments are not allowed, or null when they are fine. */
export function checkChatAttachments(messages: unknown[]): string | null {
  for (const message of messages) {
    if (!message || typeof message !== "object") continue;
    const { role, parts } = message as Message;
    if (!Array.isArray(parts)) continue;
    const files = parts.filter((p): p is Part => !!p && typeof p === "object" && (p as Part).type === "file");
    if (files.length === 0) continue;
    if (role !== "user") return "Only your own messages can carry screenshots.";
    if (files.length > MAX_IMAGES_PER_MESSAGE) return `Attach up to ${MAX_IMAGES_PER_MESSAGE} screenshots per message.`;
    for (const file of files) {
      const match = typeof file.url === "string" ? DATA_URL.exec(file.url) : null;
      if (!match || match[1] !== file.mediaType) return "Screenshots must be PNG, JPEG, WebP, or GIF images.";
      if (decodedBytes(match[2]!) > MAX_IMAGE_BYTES) return "That screenshot is too large. Try a smaller one.";
    }
  }
  return null;
}

/**
 * Keeps the newest screenshots within HISTORY_IMAGE_BUDGET and replaces older ones
 * with a short note, so the request stays small however long the chat gets.
 */
export function trimHistoryImages<M extends { parts: Array<{ type: string }> }>(
  messages: M[],
  budget = HISTORY_IMAGE_BUDGET,
): M[] {
  let used = 0;
  const trimmed = [...messages];
  for (let i = trimmed.length - 1; i >= 0; i--) {
    const message = trimmed[i]!;
    if (!message.parts.some((p) => p.type === "file")) continue;
    let dropped = false;
    const parts = message.parts.filter((p) => {
      if (p.type !== "file") return true;
      const size = String((p as { url?: unknown }).url ?? "").length;
      if (used + size <= budget) { used += size; return true; }
      dropped = true;
      return false;
    });
    if (dropped) {
      parts.push({ type: "text", text: EARLIER_SCREENSHOT_NOTE } as M["parts"][number]);
      trimmed[i] = { ...message, parts };
    }
  }
  return trimmed;
}

/** Text saved to conversation history for a user message (screenshots themselves are not stored). */
export function historyText(text: string, imageCount: number) {
  if (imageCount === 0) return text;
  const note = `[${imageCount} screenshot${imageCount === 1 ? "" : "s"} attached]`;
  return text ? `${text}\n\n${note}` : note;
}
