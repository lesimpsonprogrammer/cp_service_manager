"use client";

import { useTransition } from "react";
import { toggleWebhookActive, deleteWebhook } from "@/app/(dashboard)/webhooks/actions";
import { Button } from "@/components/ui/Button";

export function WebhookControls({ webhookId, isActive }: { webhookId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => toggleWebhookActive(webhookId, !isActive))}
      >
        {isActive ? "Pause" : "Activate"}
      </Button>
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this webhook?")) return;
          startTransition(() => deleteWebhook(webhookId));
        }}
      >
        Delete
      </Button>
    </div>
  );
}
