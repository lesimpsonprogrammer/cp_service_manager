"use client";

import { useMobileSidebar } from "./MobileSidebarContext";

export function MobileMenuButton() {
  const { toggle } = useMobileSidebar();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Open menu"
      className="-ml-1 mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-foreground md:hidden"
    >
      <span aria-hidden="true">☰</span>
    </button>
  );
}
