-- Lets a blog post carry a featured/header image (designed in Canva,
-- exported, then its URL pasted into the post form on blog-admin.html).
alter table blog_posts add column image_url text;
