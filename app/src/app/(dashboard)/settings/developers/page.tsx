import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

const ADMIN_ROLES = new Set(["owner", "admin"]);

const DEVELOPER_LINKS = [
  {
    name: "GitHub",
    description: "Source repo, PRs, and CI",
    href: "https://github.com/lesimpsonprogrammer/cp_service_manager",
    icon: "🐙",
  },
  {
    name: "Supabase",
    description: "Database, auth, and storage",
    href: "https://supabase.com/dashboard/project/ucuejofewehpuxcwvubu",
    icon: "⚡",
  },
  {
    name: "Railway",
    description: "cpsm-blog service",
    href: "https://railway.com/project/7a7b0872-e9fc-4373-8870-79a6945226b7",
    icon: "🚆",
  },
];

export default async function DevelopersSettingsPage() {
  const org = await getCurrentOrg();
  if (!org || !ADMIN_ROLES.has(org.role)) {
    redirect("/settings");
  }

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title="Developers" description="Quick links to where this workspace actually runs." />

      <Card>
        <CardHeader>
          <CardTitle>Developers</CardTitle>
          <CardDescription>Quick links to where this workspace actually runs.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {DEVELOPER_LINKS.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-5 py-3 text-sm hover:bg-surface-2"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-4 text-center text-xs" aria-hidden="true">
                      {link.icon}
                    </span>
                    <span className="text-foreground">{link.name}</span>
                    <span className="text-xs text-muted">{link.description}</span>
                  </span>
                  <span className="text-muted">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
