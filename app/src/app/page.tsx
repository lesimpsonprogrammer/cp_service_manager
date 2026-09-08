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

      <header className="relative z-10 flex items-center justify-between gap-3 px-6 py-6 lg:px-12">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold tracking-tight">
          <LogoMark className="h-7 w-7 shrink-0 text-brand dark:text-white sm:h-8 sm:w-8" />
          <span className="truncate text-xs sm:text-sm">Cloud Performance Service Manager</span>
        </div>
        <nav className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link href="/login" className="text-sm text-muted hover:text-foreground">
            Sign in
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto flex max-w-6xl flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl xl:text-5xl">
          <span className="block text-balance">
            Connect any spreadsheet, HCM, HRIS, Benefits Admin Portal, or ERP.
          </span>
          <span className="mt-2 block text-muted">Ship clean data everywhere else.</span>
        </h1>
        <p className="mt-5 max-w-xl text-balance text-base text-muted">
          Cloud Performance Service Manager is the connector, ETL, and webhook platform behind
          your data extraction and payroll operations — one dashboard, one
          API, every system your clients run.
        </p>
        <div className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <Link href="/signup" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">
              Create your workspace
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Sign in
            </Button>
          </Link>
        </div>
        <a
          href="https://www.momentumdatasolutions.com/executive-brief.html"
          className="mt-6 text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
        >
          Read the Momentum Executive Brief →
        </a>
      </section>

      <footer className="relative z-10 px-6 py-6 text-center text-xs text-muted">
        &copy; {new Date().getFullYear()} Cloud Performance Service Manager, a Momentum Data Solutions Company
      </footer>
    </main>
  );
}
