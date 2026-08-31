import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { BlogForm } from "@/components/blog/BlogForm";
import { updatePost } from "../../actions";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase.from("blog_posts").select("*").eq("id", id).single();

  if (!post) notFound();

  const { data: posts } = await supabase.from("blog_posts").select("category");
  const categories = [...new Set((posts ?? []).map((p) => p.category))].sort();

  return (
    <div>
      <PageHeader title={`Edit ${post.title}`} />
      <BlogForm
        action={updatePost.bind(null, post.id)}
        post={post}
        categories={categories}
        submitLabel="Save changes"
        submitPendingLabel="Saving…"
      />
    </div>
  );
}
