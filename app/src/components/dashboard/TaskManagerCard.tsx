import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export interface DashboardTaskRow {
  id: string;
  title: string;
  status: "backlog" | "in_progress" | "done";
  dueDate: string | null;
  assignee: string | null;
}

export function TaskManagerCard({ tasks }: { tasks: DashboardTaskRow[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const open = tasks.filter((t) => t.status !== "done");
  const overdueCount = open.filter((t) => t.dueDate && t.dueDate < today).length;

  const upcoming = [...open]
    .sort((a, b) => (a.dueDate ?? "9999") < (b.dueDate ?? "9999") ? -1 : 1)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Task Manager</CardTitle>
        <Link href="/tasks" className="text-xs text-brand hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {open.length === 0 ? (
          <div className="p-5">
            <EmptyState icon="✓" title="Nothing open" description="All caught up on enhancements and changes." />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 px-5 py-3 text-xs text-muted">
              <span>{open.length} open</span>
              {overdueCount > 0 && (
                <Badge tone="danger">
                  {overdueCount} overdue
                </Badge>
              )}
            </div>
            <ul className="divide-y divide-border">
              {upcoming.map((task) => (
                <li key={task.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{task.title}</p>
                    <p className="text-xs text-muted">
                      {task.assignee ?? "Unassigned"}
                      {task.dueDate && ` · due ${task.dueDate}`}
                    </p>
                  </div>
                  {task.dueDate && task.dueDate < today && <Badge tone="danger">Overdue</Badge>}
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
