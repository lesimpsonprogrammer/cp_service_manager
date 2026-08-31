import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Momentum Insights | Momentum Data Solutions",
  description: "Articles on data extraction, ETL, spreadsheets, HCM, ERP, HR, and payroll.",
};

export const revalidate = 300;

export default async function PublicBlogIndexPage() {
  const admin = createAdminClient();
  const { data: posts } = await admin
    .from("blog_posts")
    .select("id, title, slug, excerpt, category, author_name, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false });

  const postList = posts ?? [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Momentum Insights</h1>
      <p className="mt-2 text-muted">Data extraction, ETL, spreadsheets, HCM, ERP, HR, and payroll — from the team.</p>

      {postList.length > 0 ? (
        <ul className="mt-10 space-y-8">
          {postList.map((post) => (
            <li key={post.id} className="border-b border-border pb-8">
              <Link href={`/blog/${post.slug}`} className="text-xl font-semibold text-foreground hover:text-brand">
                {post.title}
              </Link>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted">
                {post.category}
                {post.author_name ? ` · ${post.author_name}` : ""}
                {post.published_at ? ` · ${new Date(post.published_at).toLocaleDateString()}` : ""}
              </p>
              {post.excerpt && <p className="mt-2 text-sm text-muted">{post.excerpt}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 text-sm text-muted">Nothing published yet — check back soon.</p>
      )}
    </main>
  );
}
