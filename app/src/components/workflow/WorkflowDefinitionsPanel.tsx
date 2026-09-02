"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import {
  createWorkflowDefinition,
  deleteWorkflowDefinition,
  startWorkflowInstance,
  type WorkflowFormState,
} from "@/app/(dashboard)/workflow/actions";

export interface WorkflowDefinitionRow {
  id: string;
  name: string;
  description: string | null;
  stageCount: number;
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

function StartRunForm({ definitionId }: { definitionId: string }) {
  const [state, formAction] = useActionState(startWorkflowInstance, { error: null } as WorkflowFormState);
  return (
    <form action={formAction} className="mt-3 flex items-end gap-2">
      <input type="hidden" name="workflow_definition_id" value={definitionId} />
      <div className="flex-1">
        <Label htmlFor={`run-title-${definitionId}`}>Start a run</Label>
        <Input id={`run-title-${definitionId}`} name="title" required placeholder="e.g. Acme Corp onboarding" />
      </div>
      <SubmitButton label="Start" pendingLabel="Starting…" />
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </form>
  );
}

export function WorkflowDefinitionsPanel({ definitions }: { definitions: WorkflowDefinitionRow[] }) {
  const [createState, createAction] = useActionState(createWorkflowDefinition, {
    error: null,
  } as WorkflowFormState);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {definitions.length > 0 ? (
        <ul className="divide-y divide-border">
          {definitions.map((definition) => (
            <li key={definition.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{definition.name}</p>
                  {definition.description && (
                    <p className="mt-0.5 text-xs text-muted">{definition.description}</p>
                  )}
                  <p className="mt-0.5 text-xs text-muted">
                    {definition.stageCount} stage{definition.stageCount === 1 ? "" : "s"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm(`Delete workflow "${definition.name}"? Its runs and tasks are removed too.`))
                      return;
                    startTransition(() => deleteWorkflowDefinition(definition.id));
                  }}
                >
                  Delete
                </Button>
              </div>
              <StartRunForm definitionId={definition.id} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-2 text-sm text-muted">No workflows yet — define one below.</p>
      )}

      <form action={createAction} className="space-y-3 px-5 pb-5">
        <div>
          <Label htmlFor="workflow_name">New workflow name</Label>
          <Input id="workflow_name" name="name" required placeholder="Service request intake" />
        </div>
        <div>
          <Label htmlFor="workflow_description">Description</Label>
          <Input id="workflow_description" name="description" placeholder="Optional" />
        </div>
        <div>
          <Label htmlFor="workflow_stages">Stages (one per line, in order)</Label>
          <Textarea
            id="workflow_stages"
            name="stages"
            required
            rows={4}
            placeholder={"Intake\nTriage\nIn progress\nResolved"}
          />
        </div>
        <SubmitButton label="Create workflow" pendingLabel="Creating…" />
        {createState.error && (
          <p className={cn("rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
            {createState.error}
          </p>
        )}
      </form>
    </div>
  );
}
