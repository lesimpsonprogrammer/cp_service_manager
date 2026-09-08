"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  runOrgMembersArchiveBatch,
  restoreFromArchive,
  type ArchiveActionState,
} from "@/app/(dashboard)/settings/archive/actions";

export interface ArchivedRecordRow {
  id: string;
  category: string;
  source_id: string;
  removed_at: string;
  archived_at: string;
  batch_label: string;
}

export function ArchivePanel({ records }: { records: ArchivedRecordRow[] }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function runBatch() {
    setMessage(null);
    startTransition(async () => {
      const result: ArchiveActionState = await runOrgMembersArchiveBatch();
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage(`Archived ${result.archivedCount ?? 0} record${result.archivedCount === 1 ? "" : "s"}.`);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-5 pt-4">
        <p className="text-xs text-muted">
          Moves recycle-bin members older than the retention window into archive storage — still stored, still
          restorable, just out of daily view.
        </p>
        <Button size="sm" disabled={pending} onClick={runBatch}>
          {pending ? "Running…" : "Run archive batch now"}
        </Button>
      </div>
      {message && <p className="px-5 text-xs text-muted">{message}</p>}

      {records.length === 0 ? (
        <p className="px-5 pb-4 text-sm text-muted">Nothing archived yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {records.map((record) => (
            <li key={record.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
              <div>
                <span className="font-mono text-xs text-foreground">{record.source_id}</span>
                <p className="mt-0.5 text-xs text-muted">
                  Removed {new Date(record.removed_at).toLocaleDateString()} · archived{" "}
                  {new Date(record.archived_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="neutral">{record.category}</Badge>
                <Badge tone="neutral">{record.batch_label}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => startTransition(() => { void restoreFromArchive(record.id); })}
                >
                  Restore
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
