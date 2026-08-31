import { signOut } from "@/app/(auth)/actions";
import { Badge } from "@/components/ui/Badge";
import { MobileMenuButton } from "@/components/layout/MobileMenuButton";

export function Topbar({
  title,
  userEmail,
  role,
}: {
  title: string;
  userEmail: string | null;
  role: string;
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-canvas px-4 sm:px-6">
      <div className="flex min-w-0 items-center">
        <MobileMenuButton />
        <h1 className="truncate text-sm font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <Badge tone="brand" className="capitalize">
          {role}
        </Badge>
        <span className="hidden text-sm text-muted sm:inline">{userEmail}</span>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:border-border-strong hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
