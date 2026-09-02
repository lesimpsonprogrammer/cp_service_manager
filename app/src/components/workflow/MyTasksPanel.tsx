"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { updateWorkflowTaskStatus } from "@/app/(dashboard)/workflow/actions";

export interface MyTaskRow {
  id: string;
  title: string;
  status: string;
  dueAt: string | null;
  instanceId: string;
  instanceTitle: string;
}

export function MyTasksPanel({ tasks }: { tasks: MyTaskRow[] }) {
  const [pending, startTransition] = useTransition();

  if (tasks.length === 0) {
    return <p className="px-5 py-4 text-sm text-muted">No open tasks assigned to you.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{task.title}</p>
            <p className="truncate text-xs text-muted">
              <Link href={`/workflow/${task.instanceId}`} className="hover:text-brand">
                {task.instanceTitle}
              </Link>
              {task.dueAt && ` · due ${new Date(task.dueAt).toLocaleDateString()}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge status={task.status} />
            {task.status !== "done" && (
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() =>
                  startTransition(() =>
                    updateWorkflowTaskStatus(
                      task.id,
                      task.status === "pending" ? "in_progress" : "done",
                      task.instanceId
                    )
                  )
                }
              >
                {task.status === "pending" ? "Start" : "Mark done"}
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
