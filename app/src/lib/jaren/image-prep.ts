"use client";

import type { FileUIPart } from "ai";
import { JAREN_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/jaren/attachments";

// Long edge in pixels. Large enough to read UI text in a screenshot.
const MAX_EDGE = 1600;

function dataUrlBytes(url: string) {
  return Math.floor(((url.length - url.indexOf(",") - 1) * 3) / 4);
}

/** Shrinks a pasted or uploaded image to a JPEG data URL the chat can send. */
export async function prepareScreenshot(file: File): Promise<FileUIPart> {
  if (!(JAREN_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    throw new Error("Only PNG, JPEG, WebP, or GIF images can be attached.");
  }
  const bitmap = await createImageBitmap(file);
  try {
    for (const [edge, quality] of [[MAX_EDGE, 0.85], [MAX_EDGE, 0.7], [1200, 0.7], [900, 0.6]] as const) {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("This browser cannot prepare images.");
      // JPEG has no transparency; paint white so transparent screenshots stay readable.
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL("image/jpeg", quality);
      if (dataUrlBytes(url) <= MAX_IMAGE_BYTES) {
        return { type: "file", mediaType: "image/jpeg", filename: file.name || "screenshot.jpg", url };
      }
    }
  } finally {
    bitmap.close();
  }
  throw new Error("That image is too large to attach.");
}
