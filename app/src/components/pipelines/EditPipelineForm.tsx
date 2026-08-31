"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updatePipeline, type PipelineFormState } from "@/app/(dashboard)/pipelines/actions";
import type { FieldMapping, TransformStep, TransformOp } from "@/lib/etl/transforms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";

const TRANSFORM_OPS: { value: TransformOp; label: string }[] = [
  { value: "trim", label: "Trim whitespace" },
  { value: "uppercase", label: "Uppercase" },
  { value: "lowercase", label: "Lowercase" },
  { value: "default", label: "Fill default if empty" },
  { value: "filter_equals", label: "Keep rows where field equals value" },
  { value: "drop_empty_rows", label: "Drop fully empty rows" },
];

const initialState: PipelineFormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

export function EditPipelineForm({
  pipelineId,
  dataSources,
  initialName,
  initialSourceId,
  initialDestinationId,
  initialSchedule,
  initialMapping,
  initialSteps,
}: {
  pipelineId: string;
  dataSources: { id: string; name: string; type: string }[];
  initialName: string;
  initialSourceId: string;
  initialDestinationId: string | null;
  initialSchedule: string | null;
  initialMapping: FieldMapping[];
  initialSteps: TransformStep[];
}) {
  const updateWithId = updatePipeline.bind(null, pipelineId);
  const [state, formAction] = useActionState(updateWithId, initialState);
  const [mapping, setMapping] = useState<FieldMapping[]>(
    initialMapping.length > 0 ? initialMapping : [{ source: "", target: "" }]
  );
  const [steps, setSteps] = useState<TransformStep[]>(initialSteps);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="mapping_json" value={JSON.stringify(mapping.filter((m) => m.source))} />
      <input type="hidden" name="transform_json" value={JSON.stringify(steps)} />

      <Card className="p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Basics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-0 pb-0">
          <div>
            <Label htmlFor="name">Pipeline name</Label>
            <Input id="name" name="name" required defaultValue={initialName} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="source_id">Source</Label>
              <Select id="source_id" name="source_id" required defaultValue={initialSourceId}>
                <option value="" disabled>
                  Select a data source…
                </option>
                {dataSources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="destination_id">Destination (optional)</Label>
              <Select id="destination_id" name="destination_id" defaultValue={initialDestinationId ?? ""}>
                <option value="">None — preview only</option>
                {dataSources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="schedule">Schedule (cron, optional)</Label>
            <Input
              id="schedule"
              name="schedule"
              defaultValue={initialSchedule ?? ""}
              placeholder="0 * * * * (leave blank to run manually)"
            />
            <p className="mt-1 text-xs text-muted">
              Wire a scheduler (Vercel Cron, Supabase Edge Function cron) to call this pipeline&apos;s run
              endpoint on this expression — see the README.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Field mapping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-0 pb-0">
          <p className="text-xs text-muted">
            Leave empty to pass every extracted field through unchanged. Otherwise, list which source
            fields map to which output field names.
          </p>
          {mapping.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder="Source field (e.g. Employee_ID)"
                value={row.source}
                onChange={(e) =>
                  setMapping((m) => m.map((r, idx) => (idx === i ? { ...r, source: e.target.value } : r)))
                }
              />
              <span className="text-muted">→</span>
              <Input
                placeholder="Output field (e.g. employee_id)"
                value={row.target}
                onChange={(e) =>
                  setMapping((m) => m.map((r, idx) => (idx === i ? { ...r, target: e.target.value } : r)))
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMapping((m) => m.filter((_, idx) => idx !== i))}
              >
                ✕
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => setMapping((m) => [...m, { source: "", target: "" }])}>
            + Add field
          </Button>
        </CardContent>
      </Card>

      <Card className="p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Transform steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-0 pb-0">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select
                className="max-w-[220px]"
                value={step.op}
                onChange={(e) =>
                  setSteps((s) => s.map((r, idx) => (idx === i ? { ...r, op: e.target.value as TransformOp } : r)))
                }
              >
                {TRANSFORM_OPS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </Select>
              <Input
                placeholder="Field"
                value={step.field ?? ""}
                onChange={(e) => setSteps((s) => s.map((r, idx) => (idx === i ? { ...r, field: e.target.value } : r)))}
              />
              {(step.op === "default" || step.op === "filter_equals") && (
                <Input
                  placeholder="Value"
                  value={step.value ?? ""}
                  onChange={(e) =>
                    setSteps((s) => s.map((r, idx) => (idx === i ? { ...r, value: e.target.value } : r)))
                  }
                />
              )}
              <Button type="button" variant="ghost" size="sm" onClick={() => setSteps((s) => s.filter((_, idx) => idx !== i))}>
                ✕
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setSteps((s) => [...s, { op: "trim", field: "" }])}
          >
            + Add transform
          </Button>
        </CardContent>
      </Card>

      {state.error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      <SubmitButton />
    </form>
  );
}
