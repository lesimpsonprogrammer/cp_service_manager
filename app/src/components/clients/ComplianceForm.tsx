"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Label, Textarea } from "@/components/ui/Input";
import { COMPLIANCE_FRAMEWORKS } from "@/lib/compliance/frameworks";
import type { ComplianceFormState } from "@/app/(dashboard)/clients/actions";
import type { Database } from "@/types/database";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save compliance settings"}
    </Button>
  );
}

export function ComplianceForm({
  action,
  client,
}: {
  action: (state: ComplianceFormState, formData: FormData) => Promise<ComplianceFormState>;
  client: ClientRow;
}) {
  const [state, formAction] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="space-y-6">
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="hipaa_covered_entity"
          defaultChecked={client.hipaa_covered_entity}
          className="mt-1"
        />
        <span>
          <span className="font-medium text-foreground">HIPAA</span>
          <span className="block text-muted">
            This client&apos;s data includes protected health information (HIPAA-covered).
          </span>
        </span>
      </label>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Applicable state privacy laws
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {COMPLIANCE_FRAMEWORKS.map((framework) => (
            <label key={framework.code} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="compliance_frameworks"
                value={framework.code}
                defaultChecked={client.compliance_frameworks.includes(framework.code)}
              />
              {framework.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="compliance_notes">Other compliance notes</Label>
        <Textarea
          id="compliance_notes"
          name="compliance_notes"
          rows={4}
          defaultValue={client.compliance_notes ?? ""}
          placeholder="Data residency requirements, industry-specific regulations, client-mandated security controls…"
        />
      </div>

      <p className="text-xs text-muted">
        These flags are shown to your team and printed on generated contract PDFs as a disclosure. They don&apos;t
        automatically enforce handling rules — verify obligations with counsel for each engagement.
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
