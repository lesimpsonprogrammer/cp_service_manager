import { createAdminClient } from "@/lib/supabase/admin";
import { loadWidget } from "@/lib/chat/service";
import { chatJson, isOriginAllowed, preflight } from "@/lib/chat/widget";

/**
 * Public: what the website chat widget needs to draw itself. A disabled,
 * unknown, or not-allowed-here widget is a 404, so the bubble just stays
 * hidden.
 */
export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const key = new URL(request.url).searchParams.get("key") ?? "";
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(key)) return chatJson({ error: "Unknown chat widget." }, origin, { status: 404 });

  const widget = await loadWidget(createAdminClient(), key);
  if (!widget || !widget.is_enabled || !isOriginAllowed(origin, widget.allowed_origins)) {
    return chatJson({ error: "Chat is not available here." }, origin, { status: 404 });
  }

  return chatJson(
    { title: widget.title, greeting: widget.greeting, accent_color: widget.accent_color },
    origin
  );
}

export const OPTIONS = preflight;
