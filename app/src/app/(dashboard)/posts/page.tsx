import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { NewsAdvisor } from "@/components/blog/NewsAdvisor";

export default async function BlogAdminPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, category, published, updated_at")
    .order("updated_at", { ascending: false });

  const postList = posts ?? [];
  const categories = new Map<string, typeof postList>();
  for (const post of postList) {
    const list = categories.get(post.category) ?? [];
    list.push(post);
    categories.set(post.category, list);
  }
  const sortedCategories = [...categories.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div>
      <PageHeader
        title="Blog"
        description="Post to momentumdatasolutions.com/blog — drafts stay private until published."
        action={
          <Link href="/posts/new">
            <Button>+ New post</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {sortedCategories.length > 0 ? (
            sortedCategories.map(([category, items]) => (
              <Card key={category} className="overflow-hidden">
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                </CardHeader>
                <ul className="divide-y divide-border">
                  {items.map((post) => (
                    <li key={post.id} className="flex items-center justify-between px-5 py-3 text-sm">
                      <Link href={`/posts/${post.id}`} className="font-medium text-foreground hover:text-brand">
                        {post.title}
                      </Link>
                      <div className="flex items-center gap-3">
                        <Badge tone={post.published ? "success" : "neutral"}>
                          {post.published ? "Published" : "Draft"}
                        </Badge>
                        <span className="text-xs text-muted">
                          Updated {new Date(post.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            ))
          ) : (
            <EmptyState
              icon="📝"
              title="No posts yet"
              description="Write your first post — check the News Advisor for ideas."
              action={
                <Link href="/posts/new">
                  <Button>+ New post</Button>
                </Link>
              }
            />
          )}
        </div>

        <NewsAdvisor />
      </div>
    </div>
  );
}
