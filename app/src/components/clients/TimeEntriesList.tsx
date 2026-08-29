"use client";

import { useTransition } from "react";
import { deleteTimeEntry } from "@/app/(dashboard)/time/actions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface TimeEntryRow {
  id: string;
  work_date: string;
  hours: number;
  description: string | null;
  billable: boolean;
  contract_id: string | null;
  project_id: string;
}

export function TimeEntriesList({
  clientId,
  entries,
  contractNames,
  projectNames,
}: {
  clientId: string;
  entries: TimeEntryRow[];
  contractNames: Map<string, string>;
  projectNames: Map<string, string>;
}) {
  const [pending, startTransition] = useTransition();

  if (entries.length === 0) {
    return <p className="px-5 py-4 text-sm text-muted">No time logged yet.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {entries.map((entry) => (
        <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
          <div>
            <p className="font-medium text-foreground">
              {entry.hours}h — {entry.work_date}
              <span className="ml-2 text-xs text-muted">{projectNames.get(entry.project_id) ?? "—"}</span>
              {entry.contract_id && contractNames.has(entry.contract_id) && (
                <span className="ml-2 text-xs text-muted">{contractNames.get(entry.contract_id)}</span>
              )}
            </p>
            {entry.description && <p className="text-xs text-muted">{entry.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={entry.billable ? "success" : "neutral"}>{entry.billable ? "Billable" : "Non-billable"}</Badge>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => {
                if (!confirm("Delete this time entry?")) return;
                startTransition(() => deleteTimeEntry(clientId, entry.id));
              }}
            >
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
