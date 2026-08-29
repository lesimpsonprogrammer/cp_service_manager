"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { slugify } from "@/lib/utils/slug";

export interface DocFormState {
  error: string | null;
}

async function uniqueSlug(orgId: string, title: string, ignoreId?: string) {
  const supabase = await createClient();
  const base = slugify(title);
  let slug = base;
  let suffix = 2;

  for (;;) {
    let query = supabase.from("docs").select("id").eq("org_id", orgId).eq("slug", slug);
    if (ignoreId) query = query.neq("id", ignoreId);
    const { data } = await query.maybeSingle();
    if (!data) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function createDoc(_prev: DocFormState, formData: FormData): Promise<DocFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "");
  if (!title) return { error: "Give this doc a title." };

  const slug = await uniqueSlug(org.orgId, title);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("docs")
    .insert({ org_id: org.orgId, title, slug, body, created_by: org.userId })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create doc." };

  revalidatePath("/docs");
  redirect(`/docs/${data.id}`);
}

export async function updateDoc(docId: string, _prev: DocFormState, formData: FormData): Promise<DocFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "");
  if (!title) return { error: "Give this doc a title." };

  const slug = await uniqueSlug(org.orgId, title, docId);

  const supabase = await createClient();
  const { error } = await supabase
    .from("docs")
    .update({ title, slug, body, updated_at: new Date().toISOString() })
    .eq("id", docId);

  if (error) return { error: error.message };

  revalidatePath("/docs");
  revalidatePath(`/docs/${docId}`);
  redirect(`/docs/${docId}`);
}

export async function deleteDoc(docId: string) {
  const supabase = await createClient();
  await supabase.from("docs").delete().eq("id", docId);
  revalidatePath("/docs");
  redirect("/docs");
}
