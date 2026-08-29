"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Input } from "@/components/ui/Input";

export interface DocNavItem {
  id: string;
  title: string;
  category: string;
}

export function DocsSidebar({ docs }: { docs: DocNavItem[] }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const filtered = query.trim()
      ? docs.filter((doc) => doc.title.toLowerCase().includes(query.trim().toLowerCase()))
      : docs;

    const byCategory = new Map<string, DocNavItem[]>();
    for (const doc of filtered) {
      const list = byCategory.get(doc.category) ?? [];
      list.push(doc);
      byCategory.set(doc.category, list);
    }
    for (const list of byCategory.values()) {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [docs, query]);

  return (
    <nav className="w-full shrink-0 space-y-4 sm:w-56">
      <Input
        placeholder="Filter docs…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-8 text-sm"
      />

      <Link
        href="/docs"
        className={cn(
          "block rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
          pathname === "/docs" ? "bg-brand/10 text-brand" : "text-muted hover:bg-surface-2 hover:text-foreground"
        )}
      >
        All docs
      </Link>

      {grouped.length === 0 && <p className="px-2 text-xs text-muted">No docs match &ldquo;{query}&rdquo;.</p>}

      {grouped.map(([category, items]) => (
        <div key={category}>
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted">{category}</p>
          <ul className="mt-1 space-y-0.5">
            {items.map((doc) => {
              const href = `/docs/${doc.id}`;
              const active = pathname === href;
              return (
                <li key={doc.id}>
                  <Link
                    href={href}
                    className={cn(
                      "block truncate rounded-md px-2 py-1.5 text-sm transition-colors",
                      active ? "bg-brand/10 text-brand font-medium" : "text-muted hover:bg-surface-2 hover:text-foreground"
                    )}
                  >
                    {doc.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
