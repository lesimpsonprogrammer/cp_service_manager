import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  checkDomains,
  checkSupabase,
  checkJarenConfig,
  getCodebaseInfo,
  getHostingInfo,
  getUnconfiguredChecks,
  getQuickLinks,
  type CheckResult,
} from "@/lib/status/checks";

const ADMIN_ROLES = new Set(["owner", "admin"]);

const STATUS_TONE = {
  up: "success",
  down: "danger",
  degraded: "warning",
  not_configured: "neutral",
  unknown: "neutral",
} as const;

const STATUS_LABEL = {
  up: "Up",
  down: "Down",
  degraded: "Degraded",
  not_configured: "Not configured",
  unknown: "Unknown",
} as const;

function StatusCard({ result }: { result: CheckResult }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{result.name}</CardTitle>
        <Badge tone={STATUS_TONE[result.status]}>{STATUS_LABEL[result.status]}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted">{result.detail}</p>
        {result.href && (
          <a
            href={result.href}
            target={result.href.startsWith("http") ? "_blank" : undefined}
            rel={result.href.startsWith("http") ? "noreferrer" : undefined}
            className="mt-2 inline-block text-xs text-brand hover:underline"
          >
            {result.href.startsWith("http") ? "Open ↗" : "View →"}
          </a>
        )}
      </CardContent>
    </Card>
  );
}

export default async function StatusPage() {
  const org = await getCurrentOrg();
  if (!org || !ADMIN_ROLES.has(org.role)) {
    redirect("/dashboard");
  }

  const [domains, supabase] = await Promise.all([checkDomains(), checkSupabase()]);
  const jaren = checkJarenConfig();
  const codebase = getCodebaseInfo();
  const hosting = getHostingInfo();
  const unconfigured = getUnconfiguredChecks();
  const links = getQuickLinks();

  const allResults = [...domains, supabase, jaren, codebase, hosting, ...unconfigured];
  const downCount = allResults.filter((r) => r.status === "down").length;

  return (
    <div>
      <PageHeader
        title="System Status"
        description="Live checks where CPSM has credentials to run them; links out where it doesn't yet."
        action={
          <Badge tone={downCount > 0 ? "danger" : "success"}>
            {downCount > 0 ? `${downCount} service${downCount > 1 ? "s" : ""} down` : "All checked systems up"}
          </Badge>
        }
      />

      <h3 className="mb-3 text-sm font-semibold text-foreground">Network &amp; domains</h3>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {domains.map((d) => (
          <StatusCard key={d.name} result={d} />
        ))}
      </div>

      <h3 className="mb-3 text-sm font-semibold text-foreground">Platform</h3>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatusCard result={hosting} />
        <StatusCard result={supabase} />
        <StatusCard result={codebase} />
        <StatusCard result={jaren} />
        {unconfigured.map((r) => (
          <StatusCard key={r.name} result={r} />
        ))}
      </div>

      <h3 className="mb-3 text-sm font-semibold text-foreground">Projects &amp; dashboards</h3>
      <Card>
        <CardContent className="flex flex-wrap gap-x-6 gap-y-2">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-brand hover:underline"
            >
              {link.name} ↗
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
