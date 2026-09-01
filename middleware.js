// Vercel Edge Middleware for the marketing site (momentumdatasolutions.com).
// Toggle by setting MAINTENANCE_MODE=true on the Vercel project — no code
// change or redeploy needed to flip it on/off, just a settings update
// (redeploy the same commit, or "Redeploy" in the dashboard, to pick up
// the new env var).
//
// While on, every request is redirected to /maintenance.html, except:
//   - requests already headed to /maintenance.html or its own assets
//   - anyone carrying the bypass cookie (see below), so the team can keep
//     previewing/editing the live site while visitors see the notice
//
// Bypass: set MAINTENANCE_BYPASS_TOKEN to a secret value, then visit
// https://www.momentumdatasolutions.com/?bypass=<token> once — that sets
// a cookie so the real site loads normally on every later visit.

export const config = {
  matcher: ["/((?!maintenance.html|assets/|api/|favicon.svg|robots.txt|sitemap.xml).*)"],
};

const BYPASS_COOKIE = "mds_bypass";

export default async function middleware(request) {
  if (process.env.MAINTENANCE_MODE !== "true") {
    return;
  }

  const url = new URL(request.url);
  const bypassToken = process.env.MAINTENANCE_BYPASS_TOKEN;
  const cookieHeader = request.headers.get("cookie") || "";
  const hasBypassCookie =
    bypassToken && cookieHeader.split(";").some((c) => c.trim() === `${BYPASS_COOKIE}=${bypassToken}`);

  if (hasBypassCookie) {
    return;
  }

  if (bypassToken && url.searchParams.get("bypass") === bypassToken) {
    url.searchParams.delete("bypass");
    const response = Response.redirect(url, 302);
    response.headers.append(
      "Set-Cookie",
      `${BYPASS_COOKIE}=${bypassToken}; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Lax`
    );
    return response;
  }

  return Response.redirect(new URL("/maintenance.html", request.url), 307);
}
