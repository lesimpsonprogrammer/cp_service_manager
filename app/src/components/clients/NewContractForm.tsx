"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { createContract, type ContractFormState } from "@/app/(dashboard)/clients/actions";

const initialState: ContractFormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Adding…" : "Add contract"}
    </Button>
  );
}

export function NewContractForm({ clientId }: { clientId: string }) {
  const [state, formAction] = useActionState(createContract.bind(null, clientId), initialState);

  return (
    <form action={formAction} className="space-y-3 border-t border-border p-5">
      <div>
        <Label htmlFor="contract_name">Contract name</Label>
        <Input id="contract_name" name="name" required placeholder="2026 Managed Payroll Services Agreement" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="start_date">Start date</Label>
          <Input id="start_date" name="start_date" type="date" />
        </div>
        <div>
          <Label htmlFor="end_date">End date</Label>
          <Input id="end_date" name="end_date" type="date" />
        </div>
        <div>
          <Label htmlFor="value">Annual value ($)</Label>
          <Input id="value" name="value" type="number" step="0.01" min="0" placeholder="12000" />
        </div>
      </div>
      <div>
        <Label htmlFor="contract_notes">Notes</Label>
        <Input id="contract_notes" name="notes" placeholder="Scope, renewal terms…" />
      </div>

      {state.error && (
        <p className={cn("rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
