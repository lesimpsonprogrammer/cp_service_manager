"use client";

import { Fragment, useState, useTransition } from "react";
import { undoRun } from "@/app/(dashboard)/pipelines/actions";
import { Button } from "@/components/ui/Button";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import type { Database } from "@/types/database";

type PipelineRun = Database["public"]["Tables"]["pipeline_runs"]["Row"];

function RecordsTable({ records }: { records: Array<Record<string, unknown>> }) {
  if (records.length === 0) {
    return <p className="px-4 py-3 text-sm text-muted">No records captured for this run.</p>;
  }

  const columns = Array.from(new Set(records.flatMap((r) => Object.keys(r))));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-surface-2 text-muted">
          <tr>
            {columns.map((c) => (
              <th key={c} className="whitespace-nowrap px-3 py-1.5 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {records.map((record, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c} className="whitespace-nowrap px-3 py-1.5 font-mono">
                  {record[c] === null || record[c] === undefined ? (
                    <span className="text-muted">—</span>
                  ) : (
                    String(record[c])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UndoRunButton({ runId }: { runId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ deleted: number; failed: number } | null>(null);

  if (done) {
    return (
      <p className="text-xs text-muted">
        Undone: {done.deleted} deleted{done.failed > 0 && `, ${done.failed} not found`}
      </p>
    );
  }

  return (
    <div>
      <Button
        size="sm"
        variant="danger"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete the records this run loaded from the destination? This is best-effort and matches by value.")) return;
          setError(null);
          startTransition(async () => {
            try {
              const result = await undoRun(runId);
              setDone({ deleted: result.deleted, failed: result.failed });
            } catch (err) {
              setError(err instanceof Error ? err.message : "Undo failed.");
            }
          });
        }}
      >
        {pending ? "Undoing…" : "Undo load"}
      </Button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function PipelineRunHistory({
  runs,
  destinationType,
  hasDestination,
}: {
  runs: PipelineRun[];
  destinationType: string | null;
  hasDestination: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (runs.length === 0) {
    return <p className="px-5 py-4 text-sm text-muted">No runs yet — click &ldquo;Run now&rdquo; to trigger one.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-5 py-2.5 font-medium">Started</th>
            <th className="px-5 py-2.5 font-medium">Trigger</th>
            <th className="px-5 py-2.5 font-medium">Extracted</th>
            <th className="px-5 py-2.5 font-medium">Loaded</th>
            <th className="px-5 py-2.5 font-medium">Failed</th>
            <th className="px-5 py-2.5 font-medium">Status</th>
            <th className="px-5 py-2.5 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {runs.map((run) => {
            const isOpen = expanded === run.id;
            const hasSample = (run.sample_records?.length ?? 0) > 0;
            const wasLive = (run.loaded_records?.length ?? 0) > 0;
            const canUndo = wasLive && hasDestination && destinationType === "sql_database" && !run.rolled_back_at;

            return (
              <Fragment key={run.id}>
                <tr>
                  <td className="px-5 py-2.5 text-muted">
                    {run.started_at ? new Date(run.started_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-5 py-2.5 text-muted">{run.triggered_by}</td>
                  <td className="px-5 py-2.5">{run.records_extracted}</td>
                  <td className="px-5 py-2.5">{run.records_loaded}</td>
                  <td className="px-5 py-2.5">{run.records_failed}</td>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={run.status} />
                      {run.rolled_back_at && <Badge tone="neutral">Rolled back</Badge>}
                    </div>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    {hasSample && (
                      <Button variant="ghost" size="sm" onClick={() => setExpanded(isOpen ? null : run.id)}>
                        {isOpen ? "Hide data" : "View data"}
                      </Button>
                    )}
                  </td>
                </tr>
                {isOpen && (
                  <tr>
                    <td colSpan={7} className="bg-surface-2/50 p-0">
                      <div className="border-b border-border p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs text-muted">
                            {wasLive
                              ? `Records sent to the destination (up to ${run.loaded_records.length} of what loaded).`
                              : `Preview only — nothing was sent anywhere (up to ${run.sample_records.length} shown).`}
                          </p>
                          {canUndo && <UndoRunButton runId={run.id} />}
                        </div>
                        <RecordsTable
                          records={(wasLive ? run.loaded_records : run.sample_records) as Array<Record<string, unknown>>}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
