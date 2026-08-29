"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { AGREEMENT_PLACEHOLDERS } from "@/lib/contracts/template";
import type { TemplateFormState } from "@/app/(dashboard)/templates/actions";
import type { Database } from "@/types/database";

type TemplateRow = Database["public"]["Tables"]["agreement_templates"]["Row"];

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function TemplateForm({
  action,
  template,
  submitLabel = "Create template",
  submitPendingLabel = "Creating…",
}: {
  action: (state: TemplateFormState, formData: FormData) => Promise<TemplateFormState>;
  template?: TemplateRow;
  submitLabel?: string;
  submitPendingLabel?: string;
}) {
  const [state, formAction] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <div>
        <Label htmlFor="name">Template name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={template?.name}
          placeholder="Managed Payroll Services Agreement"
        />
      </div>

      <div>
        <Label htmlFor="body">Agreement text</Label>
        <Textarea id="body" name="body" rows={16} defaultValue={template?.body ?? ""} />
        <p className="mt-1.5 text-xs text-muted">
          Use these placeholders — they&apos;re filled in automatically for each contract:{" "}
          {AGREEMENT_PLACEHOLDERS.join(", ")}
        </p>
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
