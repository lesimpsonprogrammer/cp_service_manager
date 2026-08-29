"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInClient, type ClientAuthActionState } from "../actions";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const initialState: ClientAuthActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export default function ClientLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <Suspense>
        <ClientLoginForm />
      </Suspense>
    </div>
  );
}

function ClientLoginForm() {
  const [state, formAction] = useActionState(signInClient, initialState);
  const searchParams = useSearchParams();
  const welcome = searchParams.get("welcome");

  return (
    <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-sm">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">Client portal</h2>
      <p className="mt-1.5 text-sm text-muted">
        Sign in for a live view of your projects, data syncs, contracts, and invoices.
      </p>

      {welcome && (
        <div className="mt-4 rounded-md border border-brand/30 bg-brand/10 px-3 py-2 text-sm text-foreground">
          Check your inbox to confirm your email, then sign in below.
        </div>
      )}

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
        </div>

        {state.error && (
          <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>
    </div>
  );
}
