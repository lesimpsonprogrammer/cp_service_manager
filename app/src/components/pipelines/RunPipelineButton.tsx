"use client";

import { useState, useTransition } from "react";
import { runPipelineNow } from "@/app/(dashboard)/pipelines/actions";
import { Button } from "@/components/ui/Button";
import type { PipelineRunResult } from "@/lib/etl/engine";

export function RunPipelineButton({ pipelineId }: { pipelineId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PipelineRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              setResult(await runPipelineNow(pipelineId));
            } catch (err) {
              setError(err instanceof Error ? err.message : "Run failed.");
            }
          })
        }
      >
        {pending ? "Running…" : "Run now"}
      </Button>

      {result && (
        <p className="mt-2 text-sm text-muted">
          {result.status === "succeeded" ? "✓" : result.status === "partial" ? "⚠" : "✕"}{" "}
          {result.recordsExtracted} extracted · {result.recordsLoaded} loaded
          {result.recordsFailed > 0 && ` · ${result.recordsFailed} failed`}
          {result.error && <span className="block text-danger">{result.error}</span>}
        </p>
      )}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
