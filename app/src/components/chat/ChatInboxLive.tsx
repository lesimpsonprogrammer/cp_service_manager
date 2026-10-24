"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

/**
 * Keeps the Live Chat inbox current: re-renders on any ticket or message
 * change in the workspace, and when a visitor writes it chimes, badges the
 * tab title, and (if allowed) shows a desktop notification, so a chat
 * never sits unseen while the inbox is open in another tab.
 */
export function ChatInboxLive({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [live, setLive] = useState(false);
  // Re-read after asking; the permission itself lives in the browser.
  const [, bumpPermission] = useState(0);
  const permission = useSyncExternalStore(
    noopSubscribe,
    () => (typeof Notification === "undefined" ? "unsupported" : Notification.permission),
    () => "unsupported"
  );
  const unseen = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 300);
    };

    const alertVisitor = (title: string, body: string) => {
      chime();
      if (document.hidden) {
        unseen.current += 1;
        document.title = `(${unseen.current}) ${stripCount(document.title)}`;
      }
      if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
        try {
          new Notification(title, { body: body.slice(0, 160), tag: "cpsm-live-chat" });
        } catch {
          // Some browsers only allow notifications from a service worker; the chime and title still work.
        }
      }
    };

    const channel = supabase
      .channel(`live-chat-${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets", filter: `org_id=eq.${orgId}` }, (payload) => {
        const row = payload.new as { channel?: string; requester_name?: string | null; requester_email?: string | null; description?: string };
        if (payload.eventType === "INSERT" && row.channel === "chat") {
          alertVisitor(`New chat from ${row.requester_name || row.requester_email || "a visitor"}`, row.description ?? "");
        }
        refresh();
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ticket_messages", filter: `org_id=eq.${orgId}` },
        (payload) => {
          const row = payload.new as { author_type?: string; author_name?: string | null; body?: string };
          if (row.author_type === "client") alertVisitor(`${row.author_name || "A visitor"} wrote`, row.body ?? "");
          refresh();
        }
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    // "Online" dots come from the visitor's last poll; re-check them now and then.
    const interval = setInterval(() => {
      if (!document.hidden) router.refresh();
    }, 30000);

    const onVisible = () => {
      if (document.hidden) return;
      unseen.current = 0;
      document.title = stripCount(document.title);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (timer.current) clearTimeout(timer.current);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
      document.title = stripCount(document.title);
    };
  }, [orgId, router]);

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
      <span className="inline-flex items-center gap-1.5">
        <span className={cn("h-1.5 w-1.5 rounded-full", live ? "bg-success" : "bg-muted")} />
        {live ? "Live" : "Connecting…"}
      </span>
      {permission === "default" && (
        <button
          type="button"
          className="rounded-md border border-border px-2 py-1 text-foreground hover:border-brand/50"
          onClick={() => Notification.requestPermission().then(() => bumpPermission((n) => n + 1))}
        >
          Turn on desktop alerts
        </button>
      )}
      {permission === "granted" && <span>Desktop alerts on</span>}
    </div>
  );
}

const noopSubscribe = () => () => {};
const stripCount = (title: string) => title.replace(/^\(\d+\) /, "");

/** A short two-note chime, generated so there's no audio file to ship. */
function chime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    // Autoplay blocked until the page has been clicked once; nothing to do.
  }
}
