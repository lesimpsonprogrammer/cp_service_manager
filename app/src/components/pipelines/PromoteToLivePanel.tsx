"use client";

import { useState, useTransition } from "react";
import { promoteToLive } from "@/app/(dashboard)/pipelines/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label, Select } from "@/components/ui/Input";
import type { PipelineRunResult } from "@/lib/etl/engine";

const LOADABLE_TYPES = new Set(["sql_database"]);

export function PromoteToLivePanel({
  pipelineId,
  dataSources,
}: {
  pipelineId: string;
  dataSources: { id: string; name: string; type: string }[];
}) {
  const [destinationId, setDestinationId] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PipelineRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="mt-4 border-brand/30">
      <CardHeader>
        <CardTitle>Promote to live</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted">
          This pipeline is preview only — runs extract and transform but load nowhere. Pick a destination to
          start writing real data, then it&apos;ll run once immediately so you know right away whether the load
          works.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px]">
            <Label htmlFor="promote_destination">Destination</Label>
            <Select
              id="promote_destination"
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
            >
              <option value="">Select a data source…</option>
              {dataSources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {!LOADABLE_TYPES.has(s.type) ? " (not supported as a destination yet)" : ""}
                </option>
              ))}
            </Select>
          </div>
          <Button
            disabled={pending || !destinationId}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  setResult(await promoteToLive(pipelineId, destinationId));
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Promotion failed.");
                }
              });
            }}
          >
            {pending ? "Promoting…" : "Promote & run"}
          </Button>
        </div>

        {result && (
          <p className="text-sm text-muted">
            {result.status === "succeeded" ? "✓" : result.status === "partial" ? "⚠" : "✕"}{" "}
            {result.recordsExtracted} extracted · {result.recordsLoaded} loaded
            {result.recordsFailed > 0 && ` · ${result.recordsFailed} failed`}
            {result.error && <span className="block text-danger">{result.error}</span>}
            {result.status === "succeeded" && " — this pipeline is now live."}
          </p>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
      </CardContent>
    </Card>
  );
}
