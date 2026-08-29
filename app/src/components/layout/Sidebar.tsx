"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { LogoMark } from "@/components/ui/Logo";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "◱" },
  { href: "/clients", label: "Clients", icon: "🏢" },
  { href: "/data-sources", label: "Data Sources", icon: "⇄" },
  { href: "/pipelines", label: "Pipelines", icon: "⇉" },
  { href: "/webhooks", label: "Webhooks", icon: "⇢" },
  { href: "/api-keys", label: "API Keys", icon: "⚿" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function Sidebar({ orgName }: { orgName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4 text-sm font-semibold tracking-tight">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand text-brand-foreground">
          <LogoMark className="h-4 w-4" />
        </span>
        <span className="truncate">{orgName}</span>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand/10 text-brand"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <span className="w-4 text-center text-xs">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3 text-xs text-muted">
        <a
          href="https://momentumdatasolutions.com"
          className="hover:text-foreground"
          target="_blank"
          rel="noreferrer"
        >
          momentumdatasolutions.com ↗
        </a>
      </div>
    </aside>
  );
}
