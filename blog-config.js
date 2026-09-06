// Shared Supabase client for the blog pages (blog.html, blog-post.html,
// blog-admin.html). The anon key is meant to be public — every table it can
// reach is locked down by Postgres row-level security policies
// (see app/supabase/migrations/0019_blog_posts.sql and 0023_blog_public_read.sql).
const SUPABASE_URL = "https://ucuejofewehpuxcwvubu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdWVqb2Zld2VocHV4Y3d2dWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0ODE4OTUsImV4cCI6MjEwMzA1Nzg5NX0.NfFpNMzFrI82z8OffxSgehucx6Ha03jnqGWFP81hxcA";

function getSupabaseClient() {
  return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
