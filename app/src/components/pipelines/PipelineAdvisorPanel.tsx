import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { AdvisorySeverity, PipelineAdvisory } from "@/lib/etl/advisor";

const SEVERITY_TONE: Record<AdvisorySeverity, "danger" | "warning" | "neutral"> = {
  critical: "danger",
  warning: "warning",
  info: "neutral",
};

const SEVERITY_LABEL: Record<AdvisorySeverity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
};

export function PipelineAdvisorPanel({ advisories }: { advisories: PipelineAdvisory[] }) {
  if (advisories.length === 0) {
    return (
      <Card className="mb-4 border-success/30 bg-success/5 p-4">
        <p className="text-sm text-foreground">
          <span className="text-success">✓</span> Advisor found nothing to flag — every active pipeline has
          succeeded recently, and none are stuck.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Advisor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {advisories.map((a, i) => (
          <div key={i} className="flex items-start gap-3 rounded-md border border-border/60 px-3 py-2 text-sm">
            <Badge tone={SEVERITY_TONE[a.severity]}>{SEVERITY_LABEL[a.severity]}</Badge>
            <p className="flex-1 text-foreground">
              <Link href={`/pipelines/${a.pipelineId}`} className="font-medium hover:text-brand">
                {a.pipelineName}
              </Link>{" "}
              <span className="text-muted">— {a.message}</span>
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
