"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { acceptClientInvite, type ClientAuthActionState } from "../actions";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const initialState: ClientAuthActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Creating account…" : "Set password and continue"}
    </Button>
  );
}

export default function AcceptClientInvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <Suspense>
        <AcceptForm />
      </Suspense>
    </div>
  );
}

function AcceptForm() {
  const [state, formAction] = useActionState(acceptClientInvite, initialState);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [email, setEmail] = useState(searchParams.get("email") ?? "");

  if (!token) {
    return (
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-sm text-sm text-muted">
        This invite link is missing its token — ask whoever invited you to resend it.
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-sm">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">Set up your client portal access</h2>
      <p className="mt-1.5 text-sm text-muted">Create a password to finish setting up your account.</p>

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="token" value={token} />
        <div>
          <Label htmlFor="fullName">Your name</Label>
          <Input id="fullName" name="fullName" required placeholder="Jane Doe" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required placeholder="10+ chars, upper, lower, number, symbol" />
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
