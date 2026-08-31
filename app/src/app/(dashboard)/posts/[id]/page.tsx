import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DeleteBlogPostButton } from "@/components/blog/DeleteBlogPostButton";
import { renderPostBody } from "@/lib/blog/markdown";

export default async function BlogPostAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase.from("blog_posts").select("*").eq("id", id).single();

  if (!post) notFound();

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {post.title}
            <Badge tone="brand">{post.category}</Badge>
            <Badge tone={post.published ? "success" : "neutral"}>{post.published ? "Published" : "Draft"}</Badge>
          </span>
        }
        description={`Last updated ${new Date(post.updated_at).toLocaleString()}`}
        action={
          <div className="flex items-center gap-2">
            {post.published && (
              <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm">
                  View live
                </Button>
              </a>
            )}
            <Link href={`/posts/${post.id}/edit`}>
              <Button variant="secondary" size="sm">
                Edit
              </Button>
            </Link>
            <DeleteBlogPostButton postId={post.id} />
          </div>
        }
      />

      <Card className="max-w-3xl p-6">
        {post.body.trim() ? (
          <div className="doc-content" dangerouslySetInnerHTML={{ __html: renderPostBody(post.body) }} />
        ) : (
          <p className="text-sm text-muted">This post is empty.</p>
        )}
      </Card>
    </div>
  );
}
