"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { readJarenVortexSettings, JAREN_VORTEX_DEFAULTS } from "@/lib/jaren/vortexSettings";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- required shape for JSX intrinsic augmentation
  namespace JSX {
    interface IntrinsicElements {
      "jaren-vortex": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        theme?: "dark" | "light";
        opacity?: string;
        transparent?: string;
      };
    }
  }
}

/**
 * Ambient star-vortex behind the Jaren chat panel. Theme follows the app's
 * dark/light toggle, which only flips a class on <html> — no event fires,
 * so a MutationObserver keeps this in sync when the user switches mid-chat.
 */
export function JarenVortexBackground({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [settings, setSettings] = useState(JAREN_VORTEX_DEFAULTS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      setTheme(root.classList.contains("dark") ? "dark" : "light");
      setSettings(readJarenVortexSettings());
      setMounted(true);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  if (!mounted || !settings.enabled) return null;

  return (
    <>
      <Script src="/jaren-vortex.js" strategy="afterInteractive" />
      <jaren-vortex
        theme={theme}
        opacity={String(settings.opacity)}
        transparent=""
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${className}`}
      />
    </>
  );
}
