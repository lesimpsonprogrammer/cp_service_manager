"use client";

import { useEffect, useRef } from "react";

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "wheel", "touchstart", "scroll"];

export const INACTIVITY_TIMEOUT_MS = 8 * 60 * 1000;

/**
 * Signs the user out after a stretch of no mouse/keyboard/touch activity.
 * Mount once per authenticated layout, pointed at that surface's sign-out
 * server action (staff vs. client portal use different ones).
 */
export function InactivityLogout({
  onTimeout,
  timeoutMs = INACTIVITY_TIMEOUT_MS,
}: {
  onTimeout: () => void | Promise<void>;
  timeoutMs?: number;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void onTimeout();
      }, timeoutMs);
    }

    resetTimer();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onTimeout, timeoutMs]);

  return null;
}
