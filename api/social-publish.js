// Vercel serverless function (Node runtime, auto-detected from /api).
// Pushes a published blog post to Facebook, LinkedIn, or TikTok. Called
// from blog-admin.html with the signed-in user's Supabase access token.
//
// Each platform stays disconnected (clear error, no crash) until its
// access-token env vars are set in the Vercel project — this repo has no
// developer-app credentials of its own, and can't get any without you
// registering an app with each platform first (see the chat writeup).
//
// Auth: verifies the caller's Supabase session and that they're a member
// of the post's org, via the service-role key — the same trust boundary
// blog_posts RLS already uses for writes (see 0019_blog_posts.sql).

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = "https://www.momentumdatasolutions.com";
const PLATFORMS = ["facebook", "linkedin", "tiktok"];

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { postId, platform } = req.body || {};
  if (!postId || !PLATFORMS.includes(platform)) {
    res.status(400).json({ error: "postId and a valid platform (facebook, linkedin, tiktok) are required." });
    return;
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("social-publish: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured");
    res.status(500).json({ error: "Server not configured." });
    return;
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    res.status(401).json({ error: "Sign in required." });
    return;
  }

  const user = await getUserFromToken(token);
  if (!user) {
    res.status(401).json({ error: "Invalid session." });
    return;
  }

  const post = await fetchPost(postId);
  if (!post) {
    res.status(404).json({ error: "Post not found." });
    return;
  }

  if (!(await isOrgMember(user.id, post.org_id))) {
    res.status(403).json({ error: "Not a member of this post's organization." });
    return;
  }

  if (!post.published) {
    res.status(400).json({ error: "Publish the post before pushing it to social." });
    return;
  }

  const publishers = { facebook: publishToFacebook, linkedin: publishToLinkedIn, tiktok: publishToTikTok };

  try {
    const result = await publishers[platform](post);
    res.status(200).json({ ok: true, result });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
};

async function getUserFromToken(token) {
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) return null;
  return resp.json();
}

async function fetchPost(postId) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?id=eq.${encodeURIComponent(postId)}&select=*`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  if (!resp.ok) return null;
  const rows = await resp.json();
  return rows[0] || null;
}

async function isOrgMember(userId, orgId) {
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/org_members?user_id=eq.${encodeURIComponent(userId)}&org_id=eq.${encodeURIComponent(orgId)}&select=user_id`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
  );
  if (!resp.ok) return false;
  const rows = await resp.json();
  return rows.length > 0;
}

function postUrl(post) {
  return `${SITE_URL}/blog/${post.slug}`;
}

function shareText(post) {
  return `${post.title}\n\n${post.excerpt || ""}\n\n${postUrl(post)}`.trim();
}

async function publishToFacebook(post) {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!pageId || !accessToken) {
    throw new Error(
      "Facebook isn't connected yet — create a Meta developer app, get a Page Access Token with " +
        "pages_manage_posts for your Page, then set FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN in Vercel."
    );
  }
  const resp = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: shareText(post), link: postUrl(post), access_token: accessToken }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error?.message || "Facebook post failed.");
  return data;
}

async function publishToLinkedIn(post) {
  // LINKEDIN_ORG_URN posts as the Company Page (needs the Community
  // Management API product — LinkedIn partner approval, not guaranteed).
  // Without it, falls back to posting as the authenticated member via the
  // self-serve "Share on LinkedIn" product (w_member_social) — the member
  // URN doesn't need its own env var, it's resolved from the token itself.
  const orgUrn = process.env.LINKEDIN_ORG_URN; // e.g. "urn:li:organization:12345678"
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      "LinkedIn isn't connected yet — create a LinkedIn developer app, request the \"Share on LinkedIn\" " +
        "product (personal posting, self-serve) or the Community Management API (Company Page posting, " +
        "needs LinkedIn approval), generate a token, then set LINKEDIN_ACCESS_TOKEN in Vercel " +
        "(add LINKEDIN_ORG_URN too if posting as the Page)."
    );
  }

  const author = orgUrn || (await fetchLinkedInMemberUrn(accessToken));

  const resp = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: shareText(post) },
          shareMediaCategory: "ARTICLE",
          media: [{ status: "READY", originalUrl: postUrl(post) }],
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.message || "LinkedIn post failed.");
  return data;
}

async function fetchLinkedInMemberUrn(accessToken) {
  const resp = await fetch("https://api.linkedin.com/v2/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.id) {
    throw new Error(
      data.message ||
        "Couldn't resolve the LinkedIn member for this token — make sure the \"Share on LinkedIn\" " +
          "product (r_liteprofile + w_member_social) is granted."
    );
  }
  return `urn:li:person:${data.id}`;
}

async function publishToTikTok(_post) {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      "TikTok isn't connected yet — register for the Content Posting API (requires an approved app) " +
        "and set TIKTOK_ACCESS_TOKEN in Vercel."
    );
  }
  // TikTok's Content Posting API is video/photo-first — there's no plain
  // "text + link" post type like Facebook/LinkedIn have. Posting a blog
  // announcement here means attaching an image or video per post, which
  // still needs to be designed once the app is approved.
  throw new Error("TikTok posting needs an image or video per post and isn't wired up yet.");
}
