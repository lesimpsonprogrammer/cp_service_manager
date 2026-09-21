import { Logo } from "@/components/ui/Logo";

export default function TimecardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-canvas px-6 py-12">
      <div className="mb-8 flex items-center">
        <Logo className="h-20 w-auto" />
      </div>
      <div className="w-full max-w-xl">{children}</div>
    </div>
  );
}
