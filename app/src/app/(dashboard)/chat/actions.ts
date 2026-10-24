"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { notifyStatusChanged } from "@/lib/service-desk/notify";
import { normalizeOrigin } from "@/lib/chat/widget";
import type { TicketStatus } from "@/types/database";

export interface ChatFormState {
  error: string | null;
  success?: string | null;
}

const ADMIN_ROLES = new Set(["owner", "admin"]);

/** Resolve or close a chat from the Live Chat inbox (reopening happens when the visitor writes again). */
export async function setChatStatus(ticketId: string, status: Extract<TicketStatus, "open" | "resolved" | "closed">) {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };
  if (org.role === "viewer") return { error: "Viewers can't change chats." };
  if (!["open", "resolved", "closed"].includes(status)) return { error: "Pick a valid status." };

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("tickets")
    .select("status")
    .eq("id", ticketId)
    .eq("org_id", org.orgId)
    .eq("channel", "chat")
    .maybeSingle();
  if (!before) return { error: "Chat not found." };
  if (before.status === status) return { error: null };

  const { error } = await supabase.from("tickets").update({ status, updated_by: org.userId }).eq("id", ticketId);
  if (error) return { error: error.message.includes("row-level security") ? "You don't have permission to do that." : error.message };

  after(() => notifyStatusChanged(ticketId, before.status, org.userId));
  revalidatePath("/chat");
  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
  return { error: null };
}

const optionalUuid = z
  .string()
  .trim()
  .transform((v) => v || null)
  .pipe(z.string().uuid().nullable());

const settingsSchema = z.object({
  is_enabled: z.boolean(),
  title: z.string().trim().min(1, "Give the chat a title.").max(60, "Keep the title under 60 characters."),
  greeting: z.string().trim().min(1, "Write a greeting.").max(500, "Keep the greeting under 500 characters."),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Pick a color like #1f6feb."),
  default_assignee_id: optionalUuid,
  site_url: z
    .string()
    .trim()
    .transform((v) => v.replace(/\/+$/, "") || null)
    .pipe(z.string().url("Site URL must start with https://").nullable()),
  allowed_origins: z.string(),
});

export async function saveChatWidgetSettings(_prev: ChatFormState, formData: FormData): Promise<ChatFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };
  if (!ADMIN_ROLES.has(org.role)) return { error: "Only workspace admins can change the chat widget." };

  const parsed = settingsSchema.safeParse({
    is_enabled: formData.get("is_enabled") === "on",
    title: formData.get("title") ?? "",
    greeting: formData.get("greeting") ?? "",
    accent_color: formData.get("accent_color") ?? "",
    default_assignee_id: formData.get("default_assignee_id") ?? "",
    site_url: formData.get("site_url") ?? "",
    allowed_origins: formData.get("allowed_origins") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const input = parsed.data;

  const lines = input.allowed_origins
    .split(/[\n,]/)
    .map((l) => l.trim())
    .filter(Boolean);
  const origins: string[] = [];
  for (const line of lines) {
    const origin = normalizeOrigin(line);
    if (!origin) return { error: `"${line}" isn't a site address. Use the form https://www.example.com.` };
    if (!origins.includes(origin)) origins.push(origin);
  }
  if (origins.length > 20) return { error: "List at most 20 sites." };

  if (input.default_assignee_id) {
    const supabase = await createClient();
    const { data: member } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", org.orgId)
      .eq("user_id", input.default_assignee_id)
      .maybeSingle();
    if (!member) return { error: "That person isn't on this workspace." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("chat_widget_settings").upsert(
    {
      org_id: org.orgId,
      is_enabled: input.is_enabled,
      title: input.title,
      greeting: input.greeting,
      accent_color: input.accent_color,
      default_assignee_id: input.default_assignee_id,
      site_url: input.site_url,
      allowed_origins: origins,
      updated_by: org.userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id" }
  );
  if (error) return { error: error.message.includes("row-level security") ? "You don't have permission to do that." : error.message };

  revalidatePath("/chat/settings");
  revalidatePath("/chat");
  return { error: null, success: input.is_enabled ? "Saved. The chat bubble is live on your site." : "Saved. The chat bubble is hidden." };
}
