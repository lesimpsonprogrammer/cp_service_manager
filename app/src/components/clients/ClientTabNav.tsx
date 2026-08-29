"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export function ClientTabNav({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  const base = `/clients/${clientId}`;

  const items = [
    { href: base, label: "Overview", exact: true },
    { href: `${base}/onboarding`, label: "Onboarding" },
    { href: `${base}/contracts`, label: "Contracts" },
    { href: `${base}/accounting`, label: "Accounting" },
    { href: `${base}/compliance`, label: "Compliance" },
    { href: `${base}/data-sources`, label: "Data Sources" },
  ];

  return (
    <nav className="w-44 shrink-0 space-y-0.5">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-brand/10 text-brand" : "text-muted hover:bg-surface-2 hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
