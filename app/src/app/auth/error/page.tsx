import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold text-foreground">Sign-in link expired or invalid</h1>
      <p className="max-w-sm text-sm text-muted">
        That confirmation or sign-in link no longer works. Request a new one and try again.
      </p>
      <Link href="/login">
        <Button>Back to sign in</Button>
      </Link>
    </div>
  );
}
