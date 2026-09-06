-- The blog's public read + write UI now lives on the momentumdatasolutions.com
-- root site (a static site, no server-side code) instead of this app's
-- Next.js /blog pages. The root site talks to Supabase directly with the
-- anon key, so it needs its own read policy for published posts — it can't
-- use the service-role admin client this app's /blog pages relied on.
-- Drafts stay visible only to org members via the existing
-- "org members can manage blog posts" policy.
create policy "anyone can read published blog posts"
  on blog_posts for select
  using (published = true);
