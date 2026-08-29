"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, type AuthActionState } from "../actions";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const initialState: AuthActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [state, formAction] = useActionState(signIn, initialState);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const checkEmail = searchParams.get("checkEmail");
  const pendingApproval = searchParams.get("pendingApproval");
  const [email, setEmail] = useState("");

  return (
    <div className="animate-slide-up">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h2>
      <p className="mt-1.5 text-sm text-muted">Sign in to your Cloud Performance Service Manager workspace.</p>

      {checkEmail && (
        <div className="mt-4 rounded-md border border-brand/30 bg-brand/10 px-3 py-2 text-sm text-foreground">
          Check your inbox to confirm your email, then sign in below.
          {pendingApproval && " Your access request will need to be approved before you can get in."}
        </div>
      )}

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div>
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="#" className="text-xs text-brand hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
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
        Need access?{" "}
        <Link href="/signup" className="font-medium text-brand hover:underline">
          Request an account
        </Link>
      </p>
    </div>
  );
}
