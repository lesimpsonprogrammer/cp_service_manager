"use client";

import { useState, useTransition } from "react";
import { runPipelineNow, testExtractPipeline } from "@/app/(dashboard)/pipelines/actions";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { diagnoseRunError } from "@/lib/etl/diagnostics";
import type { PipelineRunResult } from "@/lib/etl/engine";

function RunResponsePanel({ result, wasDryRun }: { result: PipelineRunResult; wasDryRun: boolean }) {
  const diagnosis = result.status === "failed" || result.status === "partial" ? diagnoseRunError(result.error) : null;

  return (
    <div className="mt-3 max-w-xl rounded-lg border border-border bg-surface-2 p-3 text-sm">
      <div className="flex items-center gap-2">
        <StatusBadge status={result.status} />
        {wasDryRun && (
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">Test extract — nothing was loaded</span>
        )}
      </div>

      <p className="mt-2 text-muted">
        {result.recordsExtracted} extracted · {result.recordsLoaded} loaded
        {result.recordsFailed > 0 && ` · ${result.recordsFailed} failed`}
      </p>

      {diagnosis && (
        <div className="mt-3 rounded-md border border-warning/30 bg-warning/5 p-3">
          <p className="font-medium text-foreground">{diagnosis.summary}</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-muted">
            {diagnosis.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
          {result.error && (
            <details className="mt-2 text-xs text-muted">
              <summary className="cursor-pointer select-none">Show raw error</summary>
              <p className="mt-1 whitespace-pre-wrap font-mono">{result.error}</p>
            </details>
          )}
        </div>
      )}

      {!diagnosis && result.status === "succeeded" && (
        <p className="mt-2 text-muted">
          {wasDryRun
            ? "Extraction and transforms worked as configured. View the record preview in run history below before promoting this to a real load."
            : "See the full record snapshot for this run in run history below."}
        </p>
      )}
    </div>
  );
}

export function RunPipelineButton({ pipelineId, hasDestination }: { pipelineId: string; hasDestination: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PipelineRunResult | null>(null);
  const [wasDryRun, setWasDryRun] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"run" | "test" | null>(null);

  const trigger = (action: "run" | "test") => {
    setPendingAction(action);
    startTransition(async () => {
      setError(null);
      try {
        const outcome = action === "test" ? await testExtractPipeline(pipelineId) : await runPipelineNow(pipelineId);
        setWasDryRun(action === "test");
        setResult(outcome);
      } catch (err) {
        setResult(null);
        setError(err instanceof Error ? err.message : "Run failed.");
      }
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <Button size="sm" disabled={pending} onClick={() => trigger("run")}>
          {pending && pendingAction === "run" ? "Running…" : "Run now"}
        </Button>
        {hasDestination && (
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => trigger("test")}>
            {pending && pendingAction === "test" ? "Testing…" : "Test extract"}
          </Button>
        )}
      </div>

      {result && <RunResponsePanel result={result} wasDryRun={wasDryRun} />}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
