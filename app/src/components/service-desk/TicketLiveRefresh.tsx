"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

/**
 * Re-renders the page (server components + RLS) whenever the ticket or its
 * conversation changes, so staff and clients see replies without reloading.
 * Debounced so a reply + status change arriving together refresh once.
 */
export function TicketLiveRefresh({
  ticketId,
  orgId,
  clientId,
  showIndicator = true,
}: {
  ticketId?: string;
  orgId?: string;
  clientId?: string;
  showIndicator?: boolean;
}) {
  const router = useRouter();
  const [live, setLive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 400);
    };

    let channel = supabase.channel(`service-desk-${ticketId ?? clientId ?? orgId ?? "queue"}`);
    if (ticketId) {
      channel = channel
        .on("postgres_changes", { event: "*", schema: "public", table: "tickets", filter: `id=eq.${ticketId}` }, refresh)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${ticketId}` },
          refresh
        );
    } else if (clientId) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets", filter: `client_id=eq.${clientId}` },
        refresh
      );
    } else if (orgId) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets", filter: `org_id=eq.${orgId}` },
        refresh
      );
    }

    channel.subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [ticketId, orgId, clientId, router]);

  if (!showIndicator) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span className={cn("h-1.5 w-1.5 rounded-full", live ? "bg-success" : "bg-muted")} />
      {live ? "Live" : "Connecting…"}
    </span>
  );
}
