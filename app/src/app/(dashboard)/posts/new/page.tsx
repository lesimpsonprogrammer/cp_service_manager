import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { BlogForm } from "@/components/blog/BlogForm";
import { createPost } from "../actions";

export default async function NewBlogPostPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase.from("blog_posts").select("category");
  const categories = [...new Set((posts ?? []).map((p) => p.category))].sort();

  return (
    <div>
      <PageHeader title="New post" description="Written in Markdown. Leave unpublished to save as a draft." />
      <BlogForm action={createPost} categories={categories} />
    </div>
  );
}
