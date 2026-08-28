"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createApiKey, type ApiKeyFormState } from "@/app/(dashboard)/api-keys/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const initialState: ApiKeyFormState = { error: null, createdKey: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Generating…" : "Generate key"}
    </Button>
  );
}

export function CreateApiKeyForm() {
  const [state, formAction] = useActionState(createApiKey, initialState);

  return (
    <div className="space-y-3">
      <form action={formAction} className="flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor="name">Key name</Label>
          <Input id="name" name="name" required placeholder="Zapier integration" />
        </div>
        <SubmitButton />
      </form>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      {state.createdKey && (
        <Card className="border-brand/40 bg-brand/5 p-4">
          <p className="text-sm font-medium text-foreground">Copy this key now — it won&apos;t be shown again.</p>
          <code className="mt-2 block break-all rounded-md bg-surface-2 px-3 py-2 text-xs">{state.createdKey}</code>
        </Card>
      )}
    </div>
  );
}
