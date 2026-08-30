import Link from "next/link";
import { LogoMark } from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r border-border bg-surface lg:flex lg:flex-col lg:justify-between">
        <div className="dotted-grid dotted-grid-pulse absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_75%)]" />
        <div className="aurora-bg" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface/80" />

        <div className="relative z-10 p-10">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <LogoMark className="h-8 w-8 text-brand dark:text-white" />
            Cloud Performance Service Manager
          </Link>
        </div>

        <div className="relative z-10 p-10">
          <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-foreground">
            One platform for every spreadsheet, HCM, and ERP connection.
          </h1>
          <p className="mt-4 max-w-lg text-sm text-muted">
            Connectors, ETL pipelines, webhooks, and a REST API — built for data
            extraction, HR consulting, and managed payroll teams who move data
            for a living.
          </p>
        </div>

        <div className="relative z-10 border-t border-border p-10 text-xs text-muted">
          &copy; {new Date().getFullYear()} Cloud Performance Service Manager. All rights reserved.
        </div>
      </div>

      <div className="flex items-center justify-center bg-canvas px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
