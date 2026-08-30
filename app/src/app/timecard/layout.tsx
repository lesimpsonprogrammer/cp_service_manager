import { LogoMark } from "@/components/ui/Logo";

export default function TimecardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-canvas px-6 py-12">
      <div className="mb-8 flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
        <LogoMark className="h-8 w-8 text-brand dark:text-white" />
        Cloud Performance Service Manager
      </div>
      <div className="w-full max-w-xl">{children}</div>
    </div>
  );
}
