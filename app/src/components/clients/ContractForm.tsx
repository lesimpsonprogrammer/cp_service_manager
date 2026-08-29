"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import type { ContractFormState } from "@/app/(dashboard)/clients/actions";
import type { Database } from "@/types/database";

type ContractRow = Database["public"]["Tables"]["client_contracts"]["Row"];
type TemplateOption = Pick<Database["public"]["Tables"]["agreement_templates"]["Row"], "id" | "name" | "body">;

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function ContractForm({
  action,
  contract,
  templates = [],
  submitLabel = "Add contract",
  submitPendingLabel = "Adding…",
}: {
  action: (state: ContractFormState, formData: FormData) => Promise<ContractFormState>;
  contract?: ContractRow;
  templates?: TemplateOption[];
  submitLabel?: string;
  submitPendingLabel?: string;
}) {
  const [state, formAction] = useActionState(action, { error: null });
  const [notes, setNotes] = useState(contract?.notes ?? "");

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="contract_name">Contract name</Label>
        <Input
          id="contract_name"
          name="name"
          required
          defaultValue={contract?.name}
          placeholder="2026 Managed Payroll Services Agreement"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="start_date">Start date</Label>
          <Input id="start_date" name="start_date" type="date" defaultValue={contract?.start_date ?? ""} />
        </div>
        <div>
          <Label htmlFor="end_date">End date</Label>
          <Input id="end_date" name="end_date" type="date" defaultValue={contract?.end_date ?? ""} />
        </div>
        <div>
          <Label htmlFor="value">Fixed/annual value ($)</Label>
          <Input
            id="value"
            name="value"
            type="number"
            step="0.01"
            min="0"
            defaultValue={contract?.value ?? ""}
            placeholder="Leave blank if billed hourly"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="hourly_rate">Hourly rate ($)</Label>
        <Input
          id="hourly_rate"
          name="hourly_rate"
          type="number"
          step="0.01"
          min="0"
          defaultValue={contract?.hourly_rate ?? ""}
          placeholder="150"
        />
      </div>

      <div>
        <Label htmlFor="client_address">Client address</Label>
        <Input
          id="client_address"
          name="client_address"
          defaultValue={contract?.client_address ?? ""}
          placeholder="123 Main St, Houston, TX 77002"
        />
      </div>

      <div>
        <Label htmlFor="services_description">Description of services</Label>
        <Textarea
          id="services_description"
          name="services_description"
          rows={2}
          defaultValue={contract?.services_description ?? ""}
          placeholder="What the Service Provider will do for the Client…"
        />
      </div>

      {templates.length > 0 && !contract && (
        <div>
          <Label htmlFor="start_from_template">Start from template</Label>
          <Select
            id="start_from_template"
            defaultValue=""
            onChange={(e) => {
              const template = templates.find((t) => t.id === e.target.value);
              if (template) setNotes(template.body);
            }}
          >
            <option value="">Blank</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="contract_notes">Agreement text / notes</Label>
        <Textarea
          id="contract_notes"
          name="notes"
          rows={templates.length > 0 ? 12 : 3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Scope, renewal terms…"
        />
      </div>

      {state.error && (
        <p className={cn("rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
          {state.error}
        </p>
      )}

      <SubmitButton label={submitLabel} pendingLabel={submitPendingLabel} />
    </form>
  );
}
