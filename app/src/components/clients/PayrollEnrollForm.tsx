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
      {pending ? "Enrolling…" : "Enroll in payroll"}
    </Button>
  );
}

export function PayrollEnrollForm({
  action,
}: {
  action: (state: PayrollFormState, formData: FormData) => Promise<PayrollFormState>;
}) {
  const [state, formAction] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div>
        <Label htmlFor="legal_name">Legal company name</Label>
        <Input id="legal_name" name="legal_name" required placeholder="Acme Consulting LLC" />
      </div>
      <div>
        <Label htmlFor="ein">EIN</Label>
        <Input id="ein" name="ein" required placeholder="12-3456789" />
      </div>
      {state.error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}
