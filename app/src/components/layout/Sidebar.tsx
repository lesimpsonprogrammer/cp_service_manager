"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { LogoMark } from "@/components/ui/Logo";
import { useMobileSidebar } from "./MobileSidebarContext";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "◱" },
  { href: "/clients", label: "Clients", icon: "🏢" },
  { href: "/workflow", label: "Workflow", icon: "🗂" },
  { href: "/time", label: "Time Tracking", icon: "⏱" },
  { href: "/invoices", label: "Invoices", icon: "🧾" },
  { href: "/docs", label: "Docs", icon: "📚" },
  { href: "/templates", label: "Agreement Templates", icon: "📄" },
  { href: "/data-sources", label: "Data Sources", icon: "⇄" },
  { href: "/pipelines", label: "Pipelines", icon: "⇉" },
  { href: "/webhooks", label: "Webhooks", icon: "⇢" },
  { href: "/api-keys", label: "API Keys", icon: "⚿" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function Sidebar({ orgName }: { orgName: string }) {
  const pathname = usePathname();
  const { isOpen, close } = useMobileSidebar();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 md:static md:z-auto md:flex md:translate-x-0",
          isOpen ? "flex translate-x-0" : "hidden -translate-x-full"
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-4 text-sm font-semibold tracking-tight">
          <LogoMark className="h-7 w-7 text-brand dark:text-white" />
          <span className="truncate">{orgName}</span>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-foreground md:hidden"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand/10 text-brand dark:text-white"
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
    </>
  );
}
