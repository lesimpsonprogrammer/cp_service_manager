import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { QuickApproveTimecardButton } from "@/components/dashboard/QuickApproveTimecardButton";
import { QuickCompleteTaskButton } from "@/components/dashboard/QuickCompleteTaskButton";

export interface PendingTimecardRow {
  id: string;
  clientId: string;
  clientName: string;
  status: "draft" | "internally_approved";
  periodStart: string;
  periodEnd: string;
  totalHours: number;
}

export interface OutstandingInvoiceRow {
  id: string;
  clientId: string;
  clientName: string;
  invoiceNumber: string;
  status: string;
  total: number;
  dueDate: string | null;
  isOverdue: boolean;
}

export interface OpenTaskRow {
  id: string;
  title: string;
  status: string;
  dueAt: string | null;
  instanceId: string;
  instanceTitle: string;
  assigneeName: string | null;
}

function SectionEmpty({ text }: { text: string }) {
  return <p className="px-5 py-3 text-sm text-muted">{text}</p>;
}

export function ActionCenterWidget({
  timecards,
  invoices,
  tasks,
}: {
  timecards: PendingTimecardRow[];
  invoices: OutstandingInvoiceRow[];
  tasks: OpenTaskRow[];
}) {
  const totalOutstanding = timecards.length + invoices.length + tasks.length;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>What needs your attention</CardTitle>
          <CardDescription>Outstanding work across timecards, invoices, and every team task.</CardDescription>
        </div>
        <Badge tone={totalOutstanding > 0 ? "warning" : "success"}>
          {totalOutstanding} outstanding
        </Badge>
      </CardHeader>

      {totalOutstanding === 0 ? (
        <CardContent>
          <p className="text-sm text-muted">Nothing outstanding — you&rsquo;re all caught up.</p>
        </CardContent>
      ) : (
        <CardContent className="space-y-5 p-0">
          <div>
            <p className="px-5 pt-4 text-xs font-medium uppercase tracking-wide text-muted">
              Timecards to approve or send ({timecards.length})
            </p>
            {timecards.length > 0 ? (
              <ul className="mt-2 divide-y divide-border">
                {timecards.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div className="min-w-0">
                      <Link href={`/clients/${t.clientId}/time`} className="font-medium text-foreground hover:text-brand">
                        {t.clientName}
                      </Link>
                      <p className="text-xs text-muted">
                        {t.periodStart} – {t.periodEnd} · {t.totalHours}h ·{" "}
                        {t.status === "draft" ? "needs internal approval" : "ready to send to client"}
                      </p>
                    </div>
                    {t.status === "draft" ? (
                      <QuickApproveTimecardButton clientId={t.clientId} timecardId={t.id} />
                    ) : (
                      <Link href={`/clients/${t.clientId}/time`}>
                        <span className="text-xs font-medium text-brand hover:underline">Send →</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <SectionEmpty text="No timecards waiting on you." />
            )}
          </div>

          <div>
            <p className="px-5 text-xs font-medium uppercase tracking-wide text-muted">
              Invoices to send or follow up ({invoices.length})
            </p>
            {invoices.length > 0 ? (
              <ul className="mt-2 divide-y divide-border">
                {invoices.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div className="min-w-0">
                      <Link
                        href={`/clients/${inv.clientId}/invoices/${inv.id}`}
                        className="font-medium text-foreground hover:text-brand"
                      >
                        {inv.invoiceNumber} · {inv.clientName}
                      </Link>
                      <p className="text-xs text-muted">
                        ${Number(inv.total).toLocaleString()} ·{" "}
                        {inv.status === "draft"
                          ? "not sent yet"
                          : inv.isOverdue
                          ? `overdue${inv.dueDate ? ` since ${new Date(inv.dueDate).toLocaleDateString()}` : ""}`
                          : "awaiting payment"}
                      </p>
                    </div>
                    <Link href={`/clients/${inv.clientId}/invoices/${inv.id}`}>
                      <span className="text-xs font-medium text-brand hover:underline">
                        {inv.status === "draft" ? "Send →" : "Follow up →"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <SectionEmpty text="No invoices need action." />
            )}
          </div>

          <div>
            <p className="px-5 text-xs font-medium uppercase tracking-wide text-muted">
              Task queue — all employees ({tasks.length})
            </p>
            {tasks.length > 0 ? (
              <ul className="mt-2 divide-y divide-border pb-2">
                {tasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{task.title}</p>
                      <p className="truncate text-xs text-muted">
                        <Link href={`/workflow/${task.instanceId}`} className="hover:text-brand">
                          {task.instanceTitle}
                        </Link>
                        {" · "}
                        {task.assigneeName ?? "Unassigned"}
                        {task.dueAt && ` · due ${new Date(task.dueAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <QuickCompleteTaskButton taskId={task.id} instanceId={task.instanceId} />
                  </li>
                ))}
              </ul>
            ) : (
              <SectionEmpty text="No open tasks across the team." />
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
