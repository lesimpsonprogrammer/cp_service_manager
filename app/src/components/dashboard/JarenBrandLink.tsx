import Link from "next/link";

/**
 * Jaren's entry point — a shimmering star mark instead of a plain sidebar
 * list row. Lives in the Topbar, so it's on every page, not just Overview.
 */
export function JarenBrandLink() {
  return (
    <Link
      href="/jaren"
      className="group flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-brand/40 hover:bg-surface-2"
    >
      <span aria-hidden="true" className="jaren-star text-base text-brand">
        ✦
      </span>
      <span>
        Jaren <span className="hidden text-muted sm:inline">+ Cloud Performance</span>
      </span>
    </Link>
  );
}
