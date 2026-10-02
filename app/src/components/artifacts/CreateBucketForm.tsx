"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { createBucket, type BucketFormState } from "@/app/(dashboard)/artifacts/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Creating…" : "Create bucket"}
    </Button>
  );
}

export function CreateBucketForm() {
  const [state, formAction] = useActionState<BucketFormState, FormData>(createBucket, { error: null });

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="bucket-name">Name</Label>
        <Input id="bucket-name" name="name" required placeholder="benefits-enrollment" className="font-mono text-xs" />
        <p className="mt-1 text-xs text-muted">Lowercase letters, numbers, and hyphens (3–63 characters).</p>
      </div>
      <div>
        <Label htmlFor="bucket-description">Description</Label>
        <Input id="bucket-description" name="description" placeholder="Open enrollment files and carrier feeds." />
      </div>
      {state.error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}
