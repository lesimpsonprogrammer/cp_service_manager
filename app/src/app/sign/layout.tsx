import { LogoWordmark } from "@/components/ui/Logo";

export default function SignLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-canvas px-6 py-12">
      <div className="mb-8 flex items-center">
        <LogoWordmark height={44} eager />
      </div>
      <div className="w-full max-w-xl">{children}</div>
    </div>
  );
}
