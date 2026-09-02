"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/Badge";
import {
  createWorkflowTask,
  deleteWorkflowTask,
  updateWorkflowTaskStatus,
  type WorkflowFormState,
} from "@/app/(dashboard)/workflow/actions";

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assigneeName: string | null;
  dueAt: string | null;
}

export interface MemberOption {
  userId: string;
  fullName: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Adding…" : "Add task"}
    </Button>
  );
}

export function TasksPanel({
  instanceId,
  tasks,
  members,
}: {
  instanceId: string;
  tasks: TaskRow[];
  members: MemberOption[];
}) {
  const [state, formAction] = useActionState(createWorkflowTask, { error: null } as WorkflowFormState);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {tasks.length > 0 ? (
        <ul className="divide-y divide-border">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{task.title}</p>
                <p className="truncate text-xs text-muted">
                  {task.assigneeName ?? "Unassigned"}
                  {task.dueAt && ` · due ${new Date(task.dueAt).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={task.status} />
                <Select
                  className="h-8 w-auto text-xs"
                  value={task.status}
                  disabled={pending}
                  onChange={(e) =>
                    startTransition(() => updateWorkflowTaskStatus(task.id, e.target.value, instanceId))
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                  <option value="skipped">Skipped</option>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => startTransition(() => deleteWorkflowTask(task.id, instanceId))}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-2 text-sm text-muted">No tasks yet for this run.</p>
      )}

      <form action={formAction} className="space-y-3 px-5 pb-5">
        <input type="hidden" name="workflow_instance_id" value={instanceId} />
        <div>
          <Label htmlFor="task_title">New task</Label>
          <Input id="task_title" name="title" required placeholder="Follow up with client" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="task_assignee">Assignee</Label>
            <Select id="task_assignee" name="assignee_id" defaultValue="">
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.fullName}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="task_due">Due date</Label>
            <Input id="task_due" name="due_at" type="date" />
          </div>
        </div>
        <SubmitButton />
        {state.error && (
          <p className={cn("rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
}
