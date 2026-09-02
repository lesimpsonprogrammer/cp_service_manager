"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import {
  advanceWorkflowInstance,
  cancelWorkflowInstance,
  completeWorkflowInstance,
} from "@/app/(dashboard)/workflow/actions";

export function InstanceActions({
  instanceId,
  status,
  hasNextStage,
}: {
  instanceId: string;
  status: string;
  hasNextStage: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (status !== "active") return null;

  return (
    <div className="flex items-center gap-2">
      {hasNextStage ? (
        <Button size="sm" disabled={pending} onClick={() => startTransition(() => advanceWorkflowInstance(instanceId))}>
          Advance stage
        </Button>
      ) : (
        <Button size="sm" disabled={pending} onClick={() => startTransition(() => completeWorkflowInstance(instanceId))}>
          Mark complete
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => {
          if (!confirm("Cancel this workflow run?")) return;
          startTransition(() => cancelWorkflowInstance(instanceId));
        }}
      >
        Cancel
      </Button>
    </div>
  );
}
