"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import type { PayrollFormState } from "@/app/(dashboard)/clients/[id]/payroll/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Submitting…" : "Submit pay run"}
    </Button>
  );
}

export function PayRunForm({
  action,
}: {
  action: (state: PayrollFormState, formData: FormData) => Promise<PayrollFormState>;
}) {
  const [state, formAction] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="pay_period_start">Period start</Label>
          <Input id="pay_period_start" name="pay_period_start" type="date" required />
        </div>
        <div>
          <Label htmlFor="pay_period_end">Period end</Label>
          <Input id="pay_period_end" name="pay_period_end" type="date" required />
        </div>
      </div>
      <div>
        <Label htmlFor="pay_date">Pay date</Label>
        <Input id="pay_date" name="pay_date" type="date" required />
      </div>
      {state.error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}
