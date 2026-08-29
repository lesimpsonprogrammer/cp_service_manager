"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { createTimecard, type TimecardFormState } from "@/app/(dashboard)/time/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Creating…" : "Create timecard from unbilled entries"}
    </Button>
  );
}

export function NewTimecardForm({ clientId }: { clientId: string }) {
  const [state, formAction] = useActionState(createTimecard.bind(null, clientId), { error: null } as TimecardFormState);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="period_start">Period start</Label>
          <Input id="period_start" name="period_start" type="date" required />
        </div>
        <div>
          <Label htmlFor="period_end">Period end</Label>
          <Input id="period_end" name="period_end" type="date" required />
        </div>
      </div>
      <p className="text-xs text-muted">
        Bundles every billable, not-yet-billed time entry in this date range into a timecard.
      </p>
      {state.error && (
        <p className={cn("rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
