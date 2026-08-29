"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import type { BillingFormState } from "@/app/(dashboard)/clients/actions";
import type { Database } from "@/types/database";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save billing details"}
    </Button>
  );
}

export function AccountingForm({
  action,
  client,
}: {
  action: (state: BillingFormState, formData: FormData) => Promise<BillingFormState>;
  client: ClientRow;
}) {
  const [state, formAction] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Client billing contact</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="billing_contact_name">Name</Label>
            <Input
              id="billing_contact_name"
              name="billing_contact_name"
              defaultValue={client.billing_contact_name ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="billing_contact_email">Email</Label>
            <Input
              id="billing_contact_email"
              name="billing_contact_email"
              type="email"
              defaultValue={client.billing_contact_email ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="billing_contact_phone">Phone</Label>
            <Input
              id="billing_contact_phone"
              name="billing_contact_phone"
              defaultValue={client.billing_contact_phone ?? ""}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Momentum billing contact</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="momentum_billing_contact_name">Name</Label>
            <Input
              id="momentum_billing_contact_name"
              name="momentum_billing_contact_name"
              defaultValue={client.momentum_billing_contact_name ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="momentum_billing_contact_email">Email</Label>
            <Input
              id="momentum_billing_contact_email"
              name="momentum_billing_contact_email"
              type="email"
              defaultValue={client.momentum_billing_contact_email ?? ""}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Payment terms</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="payment_terms">Terms</Label>
            <Input id="payment_terms" name="payment_terms" placeholder="Net 30" defaultValue={client.payment_terms ?? ""} />
          </div>
          <div>
            <Label htmlFor="payment_method">Method</Label>
            <Input
              id="payment_method"
              name="payment_method"
              placeholder="ACH, wire, check…"
              defaultValue={client.payment_method ?? ""}
            />
          </div>
        </div>
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
