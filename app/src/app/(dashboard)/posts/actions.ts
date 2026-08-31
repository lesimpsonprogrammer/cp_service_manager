"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { slugify } from "@/lib/utils/slug";

export interface BlogFormState {
  error: string | null;
}

async function uniqueSlug(orgId: string, title: string, ignoreId?: string) {
  const supabase = await createClient();
  const base = slugify(title);
  let slug = base;
  let suffix = 2;

  for (;;) {
    let query = supabase.from("blog_posts").select("id").eq("org_id", orgId).eq("slug", slug);
    if (ignoreId) query = query.neq("id", ignoreId);
    const { data } = await query.maybeSingle();
    if (!data) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

function readFields(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    body: String(formData.get("body") ?? ""),
    category: String(formData.get("category") ?? "").trim() || "General",
    authorName: String(formData.get("authorName") ?? "").trim(),
    published: formData.get("published") === "on",
  };
}

export async function createPost(_prev: BlogFormState, formData: FormData): Promise<BlogFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };

  const fields = readFields(formData);
  if (!fields.title) return { error: "Give this post a title." };

  const slug = await uniqueSlug(org.orgId, fields.title);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      org_id: org.orgId,
      title: fields.title,
      slug,
      excerpt: fields.excerpt,
      body: fields.body,
      category: fields.category,
      author_name: fields.authorName,
      published: fields.published,
      published_at: fields.published ? new Date().toISOString() : null,
      created_by: org.userId,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create post." };

  revalidatePath("/posts");
  revalidatePath("/blog");
  redirect(`/posts/${data.id}`);
}

export async function updatePost(postId: string, _prev: BlogFormState, formData: FormData): Promise<BlogFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };

  const fields = readFields(formData);
  if (!fields.title) return { error: "Give this post a title." };

  const slug = await uniqueSlug(org.orgId, fields.title, postId);
  const supabase = await createClient();

  const { data: existing } = await supabase.from("blog_posts").select("published, published_at").eq("id", postId).single();
  const publishedAt = fields.published ? (existing?.published_at ?? new Date().toISOString()) : null;

  const { error } = await supabase
    .from("blog_posts")
    .update({
      title: fields.title,
      slug,
      excerpt: fields.excerpt,
      body: fields.body,
      category: fields.category,
      author_name: fields.authorName,
      published: fields.published,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) return { error: error.message };

  revalidatePath("/posts");
  revalidatePath(`/posts/${postId}`);
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  redirect(`/posts/${postId}`);
}

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const { data: post } = await supabase.from("blog_posts").select("slug").eq("id", postId).maybeSingle();
  await supabase.from("blog_posts").delete().eq("id", postId);
  revalidatePath("/posts");
  revalidatePath("/blog");
  if (post?.slug) revalidatePath(`/blog/${post.slug}`);
}
