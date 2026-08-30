"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import type { WebhookDirection } from "@/types/database";
import { EVENT_OPTIONS } from "./constants";

export interface WebhookFormState {
  error: string | null;
}

export async function createWebhook(
  _prev: WebhookFormState,
  formData: FormData
): Promise<WebhookFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };

  const direction = String(formData.get("direction") ?? "") as WebhookDirection;
  const name = String(formData.get("name") ?? "").trim();

  if (!name) return { error: "Name this webhook." };
  if (direction !== "inbound" && direction !== "outbound") return { error: "Choose a direction." };

  const secret = randomBytes(24).toString("hex");
  const supabase = await createClient();

  if (direction === "outbound") {
    const targetUrl = String(formData.get("target_url") ?? "").trim();
    const events = EVENT_OPTIONS.filter((e) => formData.get(`event_${e}`) === "on");
    if (!targetUrl) return { error: "Target URL is required for outbound webhooks." };
    if (events.length === 0) return { error: "Select at least one event to subscribe to." };

    const { data, error } = await supabase
      .from("webhooks")
      .insert({ org_id: org.orgId, direction, name, target_url: targetUrl, events, secret })
      .select("id")
      .single();

    if (error || !data) return { error: error?.message ?? "Failed to create webhook." };
    revalidatePath("/webhooks");
    redirect(`/webhooks/${data.id}`);
  } else {
    const dataSourceId = String(formData.get("data_source_id") ?? "");
    if (!dataSourceId) return { error: "Choose which data source this webhook feeds." };

    const inboundToken = randomBytes(16).toString("hex");
    const { data, error } = await supabase
      .from("webhooks")
      .insert({ org_id: org.orgId, direction, name, data_source_id: dataSourceId, inbound_token: inboundToken, secret })
      .select("id")
      .single();

    if (error || !data) return { error: error?.message ?? "Failed to create webhook." };
    revalidatePath("/webhooks");
    redirect(`/webhooks/${data.id}`);
  }
}

export async function toggleWebhookActive(webhookId: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("webhooks").update({ is_active: isActive }).eq("id", webhookId);
  revalidatePath(`/webhooks/${webhookId}`);
  revalidatePath("/webhooks");
}

export async function deleteWebhook(webhookId: string) {
  const supabase = await createClient();
  await supabase.from("webhooks").delete().eq("id", webhookId);
  revalidatePath("/webhooks");
  redirect("/webhooks");
}
