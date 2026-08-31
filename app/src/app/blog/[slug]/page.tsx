import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderPostBody } from "@/lib/blog/markdown";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: post } = await admin
    .from("blog_posts")
    .select("title, excerpt")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (!post) return { title: "Momentum Insights" };
  return {
    title: `${post.title} | Momentum Insights`,
    description: post.excerpt || undefined,
  };
}

export default async function PublicBlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: post } = await admin
    .from("blog_posts")
    .select("title, body, category, author_name, published_at")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (!post) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/blog" className="text-sm text-muted hover:text-foreground">
        ← Momentum Insights
      </Link>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">{post.title}</h1>
      <p className="mt-2 text-xs uppercase tracking-wide text-muted">
        {post.category}
        {post.author_name ? ` · ${post.author_name}` : ""}
        {post.published_at ? ` · ${new Date(post.published_at).toLocaleDateString()}` : ""}
      </p>

      <div className="doc-content mt-8" dangerouslySetInnerHTML={{ __html: renderPostBody(post.body) }} />
    </main>
  );
}
