export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  );
}

const WORDMARK_MASK = "url(/brand/cpsm-logo-white.png) center / contain no-repeat";

/**
 * The Cloud Performance Service Manager wordmark (lettering + outline).
 * Drawn as a mask over `currentColor`, so it follows the text color:
 * pass `text-white` (or `dark:text-white`) to get the white logo.
 */
export function CpsmWordmark({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Cloud Performance Service Manager"
      className={`inline-block aspect-[1274/400] bg-current ${className ?? ""}`}
      style={{ mask: WORDMARK_MASK, WebkitMask: WORDMARK_MASK }}
    />
  );
}
