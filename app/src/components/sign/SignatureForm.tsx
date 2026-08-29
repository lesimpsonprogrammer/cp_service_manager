"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { submitSignature, type SignFormState } from "@/app/sign/[token]/actions";

const initialState: SignFormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing…" : "Sign contract"}
    </Button>
  );
}

export function SignatureForm({ token, prefillName }: { token: string; prefillName: string }) {
  const [state, formAction] = useActionState(submitSignature.bind(null, token), initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="typed_name">Type your full legal name</Label>
        <Input id="typed_name" name="typed_name" required defaultValue={prefillName} placeholder="Jane Doe" />
      </div>

      <label className="flex items-start gap-2 text-sm text-muted">
        <input type="checkbox" name="agree" className="mt-1" />
        I have read this contract and agree to its terms. I understand typing my name above and submitting
        this form constitutes my electronic signature.
      </label>

      {state.error && (
        <p className={cn("rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
