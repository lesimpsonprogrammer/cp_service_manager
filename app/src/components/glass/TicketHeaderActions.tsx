"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { deleteTicket, toggleTicketWatch } from "@/app/(dashboard)/tickets/actions";

export function WatchButton({ ticketId, watching }: { ticketId: string; watching: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => toggleTicketWatch(ticketId, !watching))}
      title={watching ? "Stop getting emails about this ticket" : "Get emailed about replies and status changes"}
    >
      {watching ? "Watching ✓" : "Watch"}
    </Button>
  );
}

export function DeleteTicketButton({ ticketId, ticketNumber }: { ticketId: string; ticketNumber: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      className="text-danger"
      onClick={() => {
        if (!confirm(`Permanently delete ${ticketNumber}, its conversation, and attachments? This can't be undone. Closing is usually better.`)) return;
        startTransition(() => deleteTicket(ticketId));
      }}
    >
      Delete
    </Button>
  );
}
