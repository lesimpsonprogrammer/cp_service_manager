"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { setRetentionPolicy, type ArchiveActionState } from "@/app/(dashboard)/settings/archive/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function RetentionPolicyForm({ category, currentYears }: { category: string; currentYears: number }) {
  const [state, formAction] = useActionState(setRetentionPolicy.bind(null, category), {
    error: null,
  } as ArchiveActionState);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div>
        <Label htmlFor={`retention_years_${category}`}>Retention window (years)</Label>
        <Input
          id={`retention_years_${category}`}
          name="years"
          type="number"
          min={1}
          max={50}
          defaultValue={currentYears}
          className="w-24"
        />
      </div>
      <SubmitButton />
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </form>
  );
}
