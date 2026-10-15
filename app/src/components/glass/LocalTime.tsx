"use client";

/**
 * Renders a timestamp in the viewer's own timezone (the server renders in
 * UTC on Vercel). `relative` shows "5m ago"-style text with the full date on hover.
 */
export function LocalTime({ iso, relative = false }: { iso: string | null | undefined; relative?: boolean }) {
  if (!iso) return <span className="text-muted">—</span>;
  const date = new Date(iso);
  const full = date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  if (!relative) {
    return (
      <time dateTime={iso} suppressHydrationWarning>
        {full}
      </time>
    );
  }
  return (
    <time dateTime={iso} title={full} suppressHydrationWarning>
      {formatRelative(date)}
    </time>
  );
}

function formatRelative(date: Date): string {
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const hours = Math.round(diffMin / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
