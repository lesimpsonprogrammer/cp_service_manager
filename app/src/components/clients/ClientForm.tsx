"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import type { ClientFormState } from "@/app/(dashboard)/clients/actions";
import type { Database } from "@/types/database";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

const initialState: ClientFormState = { error: null };

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function ClientForm({
  action,
  client,
  submitLabel = "Create client",
  submitPendingLabel = "Creating…",
}: {
  action: (state: ClientFormState, formData: FormData) => Promise<ClientFormState>;
  client?: ClientRow;
  submitLabel?: string;
  submitPendingLabel?: string;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <Card className="max-w-xl p-6">
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="name">Client name</Label>
          <Input id="name" name="name" required defaultValue={client?.name} placeholder="Acme Corp" />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={client?.status ?? "active"}>
            <option value="prospect">Prospect</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="primary_contact_name">Primary contact name</Label>
            <Input
              id="primary_contact_name"
              name="primary_contact_name"
              defaultValue={client?.primary_contact_name ?? ""}
              placeholder="Jamie Rivera"
            />
          </div>
          <div>
            <Label htmlFor="primary_contact_email">Primary contact email</Label>
            <Input
              id="primary_contact_email"
              name="primary_contact_email"
              type="email"
              defaultValue={client?.primary_contact_email ?? ""}
              placeholder="jamie@acme.com"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="primary_contact_phone">Primary contact phone</Label>
          <Input
            id="primary_contact_phone"
            name="primary_contact_phone"
            defaultValue={client?.primary_contact_phone ?? ""}
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={client?.notes ?? ""}
            placeholder="Onboarding details, contract terms, escalation contacts…"
          />
        </div>

        {state.error && (
          <p className={cn("rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
            {state.error}
          </p>
        )}

        <SubmitButton label={submitLabel} pendingLabel={submitPendingLabel} />
      </form>
    </Card>
  );
}
