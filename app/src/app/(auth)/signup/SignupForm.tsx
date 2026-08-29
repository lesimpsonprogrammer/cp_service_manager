"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signUp, type AuthActionState } from "../actions";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const initialState: AuthActionState = { error: null };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Working…" : label}
    </Button>
  );
}

export function SignupForm({
  invite,
}: {
  invite: { token: string; email: string; orgName: string } | null;
}) {
  const [state, formAction] = useActionState(signUp, initialState);

  return (
    <div className="animate-slide-up">
      {invite ? (
        <>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Join {invite.orgName}</h2>
          <p className="mt-1.5 text-sm text-muted">You&apos;ve been invited as {invite.email}.</p>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Request an account</h2>
          <p className="mt-1.5 text-sm text-muted">
            Signups are reviewed before access is granted — an admin will approve your request.
          </p>
        </>
      )}

      <form action={formAction} className="mt-6 space-y-4">
        {invite && <input type="hidden" name="invite_token" value={invite.token} />}
        {!invite && (
          <div>
            <Label htmlFor="companyName">Company / reason for access</Label>
            <Input id="companyName" name="companyName" required placeholder="Acme Payroll Co." />
          </div>
        )}
        <div>
          <Label htmlFor="fullName">Your name</Label>
          <Input id="fullName" name="fullName" required placeholder="Jordan Smith" />
        </div>
        <div>
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            defaultValue={invite?.email ?? ""}
            readOnly={!!invite}
          />
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

        <SubmitButton label={invite ? "Join workspace" : "Request access"} />
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
