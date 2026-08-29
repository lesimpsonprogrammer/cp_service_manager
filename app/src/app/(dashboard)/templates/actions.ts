"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";

export interface TemplateFormState {
  error: string | null;
}

export async function createTemplate(
  _prev: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };

  const name = String(formData.get("name") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!name) return { error: "Give this template a name." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agreement_templates")
    .insert({ org_id: org.orgId, name, body, created_by: org.userId })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create template." };

  revalidatePath("/templates");
  redirect("/templates");
}

export async function updateTemplate(
  templateId: string,
  _prev: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!name) return { error: "Give this template a name." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("agreement_templates")
    .update({ name, body, updated_at: new Date().toISOString() })
    .eq("id", templateId);

  if (error) return { error: error.message };

  revalidatePath("/templates");
  redirect("/templates");
}

export async function deleteTemplate(templateId: string) {
  const supabase = await createClient();
  await supabase.from("agreement_templates").delete().eq("id", templateId);
  revalidatePath("/templates");
  redirect("/templates");
}
