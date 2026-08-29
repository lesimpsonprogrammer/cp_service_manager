"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import type { DocFormState } from "@/app/(dashboard)/docs/actions";
import type { Database } from "@/types/database";

type DocRow = Database["public"]["Tables"]["docs"]["Row"];

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function DocForm({
  action,
  doc,
  categories = [],
  submitLabel = "Create doc",
  submitPendingLabel = "Creating…",
}: {
  action: (state: DocFormState, formData: FormData) => Promise<DocFormState>;
  doc?: DocRow;
  categories?: string[];
  submitLabel?: string;
  submitPendingLabel?: string;
}) {
  const [state, formAction] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="max-w-3xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required defaultValue={doc?.title} placeholder="Deploying a new connector" />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            list="doc-categories"
            defaultValue={doc?.category ?? "General"}
            placeholder="General"
          />
          <datalist id="doc-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </div>
      </div>

      <div>
        <Label htmlFor="body">Body (Markdown)</Label>
        <Textarea
          id="body"
          name="body"
          rows={20}
          defaultValue={doc?.body ?? ""}
          className="font-mono text-xs"
          placeholder={"# Heading\n\n- Bullet\n- Points\n\n```bash\nnpm run dev\n```"}
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
