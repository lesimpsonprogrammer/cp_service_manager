import { getLatestIndustryNews } from "@/lib/news/feeds";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

function timeAgo(pubDate: string | null): string | null {
  if (!pubDate) return null;
  const time = Date.parse(pubDate);
  if (Number.isNaN(time)) return null;

  const hours = Math.max(0, Math.round((Date.now() - time) / 3_600_000));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/**
 * Server component — fetches on render (feed responses are cached for an
 * hour, see src/lib/news/feeds.ts), so this stays a plain async component
 * rather than a client-side fetch.
 */
export async function NewsAdvisor() {
  const news = await getLatestIndustryNews(10);

  if (news.length === 0) {
    return (
      <EmptyState
        icon="📰"
        title="No headlines available right now"
        description="Feed sources may be temporarily unreachable — try again shortly."
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>News Advisor</CardTitle>
        <CardDescription>
          Latest headlines across HR, payroll, data, and business — for post ideas, not shown to readers.
        </CardDescription>
      </CardHeader>

      <ul className="divide-y divide-border">
        {news.map((item) => (
          <li key={item.link} className="px-5 py-3 text-sm">
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-brand"
            >
              {item.title}
            </a>
            <p className="mt-1 text-xs text-muted">
              {item.source}
              {timeAgo(item.pubDate) ? ` · ${timeAgo(item.pubDate)}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
