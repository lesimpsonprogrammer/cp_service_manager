"use client";

import { useEffect, useRef } from "react";
import { timeOfDayGreeting } from "@/lib/utils/time";

/**
 * Renders as a neutral "Welcome back" during SSR (server time isn't the
 * viewer's local time) and swaps to a time-of-day greeting once mounted,
 * by mutating the DOM directly so there's no server/client render mismatch.
 */
export function Greeting({ name }: { name: string | null }) {
  const ref = useRef<HTMLSpanElement>(null);
  const suffix = name ? `, ${name}` : "";

  useEffect(() => {
    if (ref.current) ref.current.textContent = `${timeOfDayGreeting()}${suffix}`;
  }, [suffix]);

  return (
    <span ref={ref} suppressHydrationWarning>
      {`Welcome back${suffix}`}
    </span>
  );
}
