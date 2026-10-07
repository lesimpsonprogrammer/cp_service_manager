import Image from "next/image";
import { cn } from "@/lib/utils/cn";

const BRAND_NAME = "Cloud Performance Service Manager";

// Source art lives in docs/brand/; these are the web-sized renders.
const WORDMARK_SRC = "/brand/cp-logo-wordmark.png";
const WORDMARK_RATIO = 960 / 342;
const ANIMATED_WEBM_SRC = "/brand/cp-logo-animated.webm";
const ANIMATED_MP4_SRC = "/brand/cp-logo-animated.mp4";
const POSTER_SRC = "/brand/cp-logo-poster.png";

/**
 * Horizontal "Cloud Performance / Service Manager" badge. It carries the
 * product name (as its alt text), so callers don't repeat it next to it.
 * `height` is the rendered CSS height in px.
 */
export function LogoWordmark({
  height = 36,
  eager,
  className,
}: {
  height?: number;
  /** Load immediately — for above-the-fold placements. */
  eager?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={WORDMARK_SRC}
      alt={BRAND_NAME}
      width={Math.round(height * WORDMARK_RATIO)}
      height={height}
      loading={eager ? "eager" : undefined}
      className={cn("shrink-0", className)}
    />
  );
}

/**
 * Animated square brand tile. Decorative — pair it with visible copy.
 * Falls back to a still frame when the viewer prefers reduced motion.
 */
export function AnimatedLogo({ className }: { className?: string }) {
  return (
    // Inline radius on purpose: globals.css forces every `rounded-*` class to the
    // app's square corner token, but this rounding belongs to the logo art.
    <div
      className={cn("relative aspect-square shrink-0 overflow-hidden", className)}
      style={{ borderRadius: "6%" }}
      aria-hidden="true"
    >
      <video
        poster={POSTER_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="h-full w-full object-cover motion-reduce:hidden"
      >
        <source src={ANIMATED_WEBM_SRC} type="video/webm" />
        <source src={ANIMATED_MP4_SRC} type="video/mp4" />
      </video>
      <Image src={POSTER_SRC} alt="" fill sizes="320px" className="hidden object-cover motion-reduce:block" />
    </div>
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
