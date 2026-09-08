import Link from "next/link";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";

const ADMIN_ROLES = new Set(["owner", "admin"]);

const SETTINGS_SECTIONS = [
  {
    href: "/settings/team",
    name: "Access Permissions",
    description: "Workspace details, members, invites, and pending signup requests.",
    icon: "👥",
    adminOnly: false,
  },
  {
    href: "/settings/appearance",
    name: "Appearance",
    description: "Theme, accent color, and background.",
    icon: "🎨",
    adminOnly: false,
  },
  {
    href: "/settings/docs",
    name: "Docs",
    description: "The categories available when writing a doc.",
    icon: "📚",
    adminOnly: false,
  },
  {
    href: "/settings/archive",
    name: "Data retention & archive",
    description: "Removed data is archived, not deleted -- retention windows and archived records.",
    icon: "🗄",
    adminOnly: true,
  },
  {
    href: "/settings/developers",
    name: "Developers",
    description: "Quick links to where this workspace actually runs.",
    icon: "🛠",
    adminOnly: true,
  },
];

export default async function SettingsPage() {
  const org = await getCurrentOrg();
  const isAdmin = !!org && ADMIN_ROLES.has(org.role);
  const sections = SETTINGS_SECTIONS.filter((s) => !s.adminOnly || isAdmin);

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title="Settings" description="Workspace configuration, organized by area." />

      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {sections.map((section) => (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className="flex items-center justify-between px-5 py-4 text-sm hover:bg-surface-2"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg" aria-hidden="true">
                      {section.icon}
                    </span>
                    <span>
                      <span className="block font-medium text-foreground">{section.name}</span>
                      <span className="text-xs text-muted">{section.description}</span>
                    </span>
                  </span>
                  <span className="text-muted">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
