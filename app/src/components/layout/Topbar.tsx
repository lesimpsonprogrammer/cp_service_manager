import { signOut } from "@/app/(auth)/actions";
import { Badge } from "@/components/ui/Badge";

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
    <header className="flex h-14 items-center justify-between border-b border-border bg-canvas px-6">
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>

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
