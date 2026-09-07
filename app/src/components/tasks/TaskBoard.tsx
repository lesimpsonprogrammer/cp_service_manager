"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { TASK_ASSIGNEES } from "@/lib/tasks/assignees";
import {
  createTask,
  deleteTask,
  updateTaskAssignee,
  updateTaskDueDate,
  updateTaskNotes,
  updateTaskPriority,
  updateTaskStatus,
  type TaskFormState,
} from "@/app/(dashboard)/tasks/actions";
import type { EnhancementTaskPriority, EnhancementTaskStatus } from "@/types/database";

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  status: EnhancementTaskStatus;
  priority: EnhancementTaskPriority;
  assignee: string | null;
  due_date: string | null;
}

const COLUMNS: { status: EnhancementTaskStatus; label: string }[] = [
  { status: "backlog", label: "Backlog" },
  { status: "in_progress", label: "In progress" },
  { status: "done", label: "Done" },
];

const PRIORITY_TONE: Record<EnhancementTaskPriority, "neutral" | "warning" | "danger"> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
};

function isOverdue(dueDate: string | null, status: EnhancementTaskStatus) {
  if (!dueDate || status === "done") return false;
  return dueDate < new Date().toISOString().slice(0, 10);
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Adding…" : "Add task"}
    </Button>
  );
}

function TaskCard({ task }: { task: TaskRow }) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(task.notes ?? "");
  const overdue = isOverdue(task.due_date, task.status);

  return (
    <Card className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{task.title}</p>
        <Badge tone={PRIORITY_TONE[task.priority]} className="shrink-0 capitalize">
          {task.priority}
        </Badge>
      </div>

      {task.description && <p className="mt-1.5 text-sm text-muted">{task.description}</p>}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Select
          value={task.status}
          disabled={isPending}
          onChange={(e) =>
            startTransition(() => updateTaskStatus(task.id, e.target.value as EnhancementTaskStatus))
          }
        >
          {COLUMNS.map((c) => (
            <option key={c.status} value={c.status}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select
          value={task.priority}
          disabled={isPending}
          onChange={(e) =>
            startTransition(() => updateTaskPriority(task.id, e.target.value as EnhancementTaskPriority))
          }
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <Select
          value={task.assignee ?? ""}
          disabled={isPending}
          onChange={(e) => startTransition(() => updateTaskAssignee(task.id, e.target.value))}
        >
          <option value="">Unassigned</option>
          {TASK_ASSIGNEES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          value={task.due_date ?? ""}
          disabled={isPending}
          className={cn(overdue && "border-danger text-danger")}
          onChange={(e) => startTransition(() => updateTaskDueDate(task.id, e.target.value))}
        />
      </div>
      {overdue && <p className="mt-1 text-xs font-medium text-danger">Overdue</p>}

      <Textarea
        className="mt-2"
        rows={2}
        placeholder="Notes…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => {
          if (notes !== (task.notes ?? "")) startTransition(() => updateTaskNotes(task.id, notes));
        }}
      />

      <div className="mt-2 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => deleteTask(task.id))}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}

export function TaskBoard({ tasks }: { tasks: TaskRow[] }) {
  const [state, formAction] = useActionState(createTask, { error: null } as TaskFormState);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Log a task</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={formAction}
            className="grid gap-3 sm:grid-cols-[1fr_1fr_120px_160px_140px_auto] sm:items-end"
          >
            <div className="sm:col-span-2">
              <Label htmlFor="task_title">Title</Label>
              <Input id="task_title" name="title" required placeholder="What needs doing?" />
            </div>
            <div>
              <Label htmlFor="task_priority">Priority</Label>
              <Select id="task_priority" name="priority" defaultValue="medium">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="task_assignee">Assignee</Label>
              <Select id="task_assignee" name="assignee" defaultValue="">
                <option value="">Unassigned</option>
                {TASK_ASSIGNEES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="task_due_date">Due date</Label>
              <Input id="task_due_date" name="due_date" type="date" />
            </div>
            <SubmitButton />
            <div className="sm:col-span-6">
              <Label htmlFor="task_description">Description</Label>
              <Input id="task_description" name="description" placeholder="Optional details" />
            </div>
            {state.error && (
              <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger sm:col-span-6">
                {state.error}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {tasks.length === 0 ? (
        <EmptyState icon="✓" title="No tasks yet" description="Log the first enhancement or change above." />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div key={col.status}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                  <span className="text-xs text-muted">{columnTasks.length}</span>
                </div>
                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
