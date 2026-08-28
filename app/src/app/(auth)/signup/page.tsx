"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { signUp, type AuthActionState } from "../actions";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const initialState: AuthActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Creating workspace…" : "Create workspace"}
    </Button>
  );
}

export default function SignupPage() {
  const [state, formAction] = useFormState(signUp, initialState);

  return (
    <div className="animate-slide-up">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">Create your workspace</h2>
      <p className="mt-1.5 text-sm text-muted">
        Start connecting spreadsheets, HCM, and ERP systems in minutes.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="companyName">Company name</Label>
          <Input id="companyName" name="companyName" required placeholder="Acme Payroll Co." />
        </div>
        <div>
          <Label htmlFor="fullName">Your name</Label>
          <Input id="fullName" name="fullName" required placeholder="Jordan Smith" />
        </div>
        <div>
          <Label htmlFor="email">Work email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
          />
        </div>

        {state.error && (
          <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have a workspace?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
