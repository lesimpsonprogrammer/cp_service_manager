"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateClientPassword, type ClientAuthActionState } from "@/app/client/actions";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const initialState: ClientAuthActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Updating…" : "Update password"}
    </Button>
  );
}

export default function ClientResetPasswordPage() {
  const [state, formAction] = useActionState(updateClientPassword, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Time to update your password</h2>
        <p className="mt-1.5 text-sm text-muted">
          For security, passwords need to be refreshed every 30 days. Set a new one to continue.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="10+ chars, upper, lower, number, symbol"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
          </div>

          {state.error && (
            <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
