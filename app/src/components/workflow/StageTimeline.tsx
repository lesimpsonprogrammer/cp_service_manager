import { cn } from "@/lib/utils/cn";

export interface StageStep {
  id: string;
  name: string;
}

export function StageTimeline({
  stages,
  currentStageId,
  status,
}: {
  stages: StageStep[];
  currentStageId: string | null;
  status: string;
}) {
  const currentIndex = stages.findIndex((s) => s.id === currentStageId);

  return (
    <ol className="flex flex-wrap items-center gap-2">
      {stages.map((stage, index) => {
        const isCurrent = stage.id === currentStageId;
        const isPast = status === "completed" || (currentIndex >= 0 && index < currentIndex);
        return (
          <li key={stage.id} className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                isCurrent
                  ? "border-brand bg-brand/10 text-brand"
                  : isPast
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-border bg-surface-2 text-muted"
              )}
            >
              {stage.name}
            </span>
            {index < stages.length - 1 && <span className="text-muted">→</span>}
          </li>
        );
      })}
    </ol>
  );
}
