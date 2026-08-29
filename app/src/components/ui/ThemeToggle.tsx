"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);

    try {
      const brand = JSON.parse(localStorage.getItem("brandColor") ?? "null") as {
        light: string;
        dark: string;
      } | null;
      if (brand) {
        const hsl = next ? brand.dark : brand.light;
        document.documentElement.style.setProperty("--brand", hsl);
        document.documentElement.style.setProperty("--accent", hsl);
      }
      const bg = JSON.parse(localStorage.getItem("background") ?? "null") as {
        light: Record<string, string>;
        dark: Record<string, string>;
      } | null;
      if (bg) {
        const tokens = next ? bg.dark : bg.light;
        document.documentElement.style.setProperty("--canvas", tokens.canvas!);
        document.documentElement.style.setProperty("--surface", tokens.surface!);
        document.documentElement.style.setProperty("--surface-2", tokens.surface2!);
        document.documentElement.style.setProperty("--border", tokens.border!);
        document.documentElement.style.setProperty("--border-strong", tokens.borderStrong!);
      }
    } catch {
      // ignore malformed storage
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      suppressHydrationWarning
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-border-strong hover:text-foreground",
        className
      )}
    >
      <span suppressHydrationWarning>{isDark ? "☀" : "☾"}</span>
    </button>
  );
}
