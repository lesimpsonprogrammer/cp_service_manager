/**
 * Lightweight RSS aggregator for the blog admin's "News Advisor" widget —
 * pulls recent headlines from a curated list of free HR, payroll, data, and
 * business feeds so you can see what's worth writing about without leaving
 * the dashboard.
 *
 * No RSS parsing library is added on purpose: RSS <item> blocks are simple
 * enough that a small regex pass covers the common feed shapes, and this is
 * a best-effort widget, not something anything else depends on.
 *
 * NOTE: feed URLs below are the standard/documented endpoints for each
 * publisher at the time this was written. Outlets occasionally change their
 * feed paths — if a source stops showing headlines, verify its current RSS
 * URL and update it here.
 */

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string | null;
}

interface FeedSource {
  name: string;
  url: string;
}

const FEEDS: FeedSource[] = [
  { name: "SHRM", url: "https://www.shrm.org/rss" },
  { name: "IRS Newsroom", url: "https://www.irs.gov/pub/irs-utl/rss_all_topics.xml" },
  { name: "HR Dive", url: "https://www.hrdive.com/feeds/news/" },
  { name: "CFO Dive", url: "https://www.cfodive.com/feeds/news/" },
];

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&");
}

function extractTag(block: string, tag: string): string | null {
  const cdataMatch = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i"));
  if (cdataMatch) return decodeEntities(cdataMatch[1]!.trim());

  const plainMatch = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (plainMatch) return decodeEntities(plainMatch[1]!.trim());

  return null;
}

function parseRssItems(xml: string, source: string, limit: number): NewsItem[] {
  const items: NewsItem[] = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];

  for (const block of itemBlocks) {
    const title = extractTag(block, "title");
    const link =
      extractTag(block, "link") ??
      block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i)?.[1] ??
      null;
    const pubDate = extractTag(block, "pubDate") ?? extractTag(block, "published") ?? extractTag(block, "updated");

    if (title && link) {
      items.push({ title, link: link.trim(), source, pubDate });
    }
    if (items.length >= limit) break;
  }

  return items;
}

async function fetchFeed(feed: FeedSource, perFeedLimit: number): Promise<NewsItem[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MomentumNewsAdvisor/1.0)" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssItems(xml, feed.name, perFeedLimit);
  } catch {
    // A single dead/renamed feed shouldn't take the whole widget down.
    return [];
  }
}

/**
 * Fetches the latest headlines across all configured feeds, most recent
 * first where a date is available. Failures are silent per-feed — the
 * widget just shows fewer sources rather than erroring out.
 */
export async function getLatestIndustryNews(totalLimit = 12): Promise<NewsItem[]> {
  const perFeedLimit = Math.ceil(totalLimit / FEEDS.length) + 2;
  const results = await Promise.all(FEEDS.map((feed) => fetchFeed(feed, perFeedLimit)));
  const combined = results.flat();

  combined.sort((a, b) => {
    const aTime = a.pubDate ? Date.parse(a.pubDate) : 0;
    const bTime = b.pubDate ? Date.parse(b.pubDate) : 0;
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });

  return combined.slice(0, totalLimit);
}
