"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { createTimeEntry, type TimeEntryFormState } from "@/app/(dashboard)/time/actions";

type ContractOption = { id: string; name: string; hourly_rate: number | null };
type ProjectOption = { id: string; name: string; project_code: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Logging…" : "Log time"}
    </Button>
  );
}

export function TimeEntryForm({
  clientId,
  projects,
  contracts,
}: {
  clientId: string;
  projects: ProjectOption[];
  contracts: ContractOption[];
}) {
  const [state, formAction] = useActionState(createTimeEntry.bind(null, clientId), { error: null } as TimeEntryFormState);

  if (projects.length === 0) {
    return <p className="text-sm text-muted">Add a project above before logging time.</p>;
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="project_id">Project</Label>
          <Select id="project_id" name="project_id" required defaultValue="">
            <option value="" disabled>
              Choose a project
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.project_code})
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="work_date">Date</Label>
          <Input
            id="work_date"
            name="work_date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div>
          <Label htmlFor="hours">Hours</Label>
          <Input id="hours" name="hours" type="number" step="0.25" min="0.25" required placeholder="1.5" />
        </div>
      </div>

      {contracts.length > 0 && (
        <div>
          <Label htmlFor="contract_id">Contract (for billing rate)</Label>
          <Select id="contract_id" name="contract_id" defaultValue="">
            <option value="">No specific contract</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.hourly_rate != null ? ` ($${c.hourly_rate}/hr)` : ""}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="description">What did you work on?</Label>
        <Input id="description" name="description" placeholder="Payroll file cleanup, weekly HR consult…" />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="billable" defaultChecked />
        Billable
      </label>

      {state.error && (
        <p className={cn("rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
