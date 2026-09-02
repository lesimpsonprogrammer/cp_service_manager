import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";

export interface ActiveInstanceRow {
  id: string;
  title: string;
  workflowName: string;
  stageName: string | null;
  status: string;
  openTaskCount: number;
}

export function ActiveInstancesTable({ instances }: { instances: ActiveInstanceRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-5 py-3 font-medium">Run</th>
            <th className="px-5 py-3 font-medium">Workflow</th>
            <th className="px-5 py-3 font-medium">Stage</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Open tasks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {instances.map((instance) => (
            <tr key={instance.id} className="hover:bg-surface-2/60">
              <td className="px-5 py-3">
                <Link href={`/workflow/${instance.id}`} className="font-medium text-foreground hover:text-brand">
                  {instance.title}
                </Link>
              </td>
              <td className="px-5 py-3 text-muted">{instance.workflowName}</td>
              <td className="px-5 py-3 text-muted">{instance.stageName ?? "—"}</td>
              <td className="px-5 py-3">
                <StatusBadge status={instance.status} />
              </td>
              <td className="px-5 py-3 text-muted">{instance.openTaskCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
