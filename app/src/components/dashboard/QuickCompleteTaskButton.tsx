"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { updateWorkflowTaskStatus } from "@/app/(dashboard)/workflow/actions";

export function QuickCompleteTaskButton({ taskId, instanceId }: { taskId: string; instanceId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() => startTransition(() => updateWorkflowTaskStatus(taskId, "done", instanceId))}
    >
      {pending ? "Saving…" : "Mark done"}
    </Button>
  );
}
