"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { LogoMark } from "@/components/ui/Logo";
import { useMobileSidebar } from "./MobileSidebarContext";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "◱" },
  { href: "/clients", label: "Clients", icon: "🏢" },
  { href: "/workflow", label: "Workflow Center", icon: "🗂" },
  { href: "/tasks", label: "Task Manager", icon: "✓" },
  { href: "/time", label: "Time Tracking", icon: "⏱" },
  { href: "/invoices", label: "Invoices", icon: "🧾" },
  { href: "/docs", label: "Docs", icon: "📚" },
  { href: "/posts", label: "Blog", icon: "📝" },
  { href: "/templates", label: "Agreement Templates", icon: "📄" },
  { href: "/data-sources", label: "Data Sources", icon: "⇄" },
  { href: "/pipelines", label: "Pipelines", icon: "⇉" },
  { href: "/webhooks", label: "Webhooks", icon: "⇢" },
  { href: "/api-keys", label: "API Keys", icon: "⚿" },
  { href: "/sql-editor", label: "SQL Editor", icon: "🛢", adminOnly: true },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

const ADMIN_ROLES = new Set(["owner", "admin"]);

const DEVELOPER_LINKS = [
  { name: "GitHub", href: "https://github.com/lesimpsonprogrammer/cp_service_manager", icon: "🐙" },
  { name: "Supabase", href: "https://supabase.com/dashboard/project/ucuejofewehpuxcwvubu", icon: "⚡" },
  { name: "Railway", href: "https://railway.com/project/7a7b0872-e9fc-4373-8870-79a6945226b7", icon: "🚆" },
];

export function Sidebar({ orgName, role }: { orgName: string; role: string }) {
  const pathname = usePathname();
  const { isOpen, close } = useMobileSidebar();
  const isAdmin = ADMIN_ROLES.has(role);
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

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
          {items.map((item) => {
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
          {isAdmin && (
            <div className="mb-2 flex items-center gap-2.5">
              {DEVELOPER_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  title={link.name}
                  aria-label={link.name}
                  className="hover:text-foreground"
                >
                  <span aria-hidden="true">{link.icon}</span>
                </a>
              ))}
            </div>
          )}
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
