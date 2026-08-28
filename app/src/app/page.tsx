import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/Logo";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-canvas">
      <div className="dotted-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 lg:px-12">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand text-brand-foreground">
            <LogoMark className="h-4 w-4" />
          </span>
          CP Service Manager
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted hover:text-foreground">
            Sign in
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
          Data extraction · HR consulting · Managed payroll
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl xl:text-5xl">
          <span className="block text-balance">
            Connect any spreadsheet, HCM, HRIS, Benefits Admin Portal, or ERP.
          </span>
          <span className="mt-2 block text-muted">Ship clean data everywhere else.</span>
        </h1>
        <p className="mt-5 max-w-xl text-balance text-base text-muted">
          CP Service Manager is the connector, ETL, and webhook platform behind
          your data extraction and payroll operations — one dashboard, one
          API, every system your clients run.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Link href="/signup">
            <Button size="lg">Create your workspace</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      <footer className="relative z-10 px-6 py-6 text-center text-xs text-muted">
        &copy; {new Date().getFullYear()} CP Service Manager · a Momentum Data platform
      </footer>
    </main>
  );
}
