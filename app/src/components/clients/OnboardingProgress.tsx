import { cn } from "@/lib/utils/cn";
import type { OnboardingStage } from "@/types/database";

const STAGES: { stage: OnboardingStage; label: string }[] = [
  { stage: "not_started", label: "Not started" },
  { stage: "contract_sent", label: "Contract sent" },
  { stage: "contract_signed", label: "Contract signed" },
  { stage: "in_progress", label: "Onboarding in progress" },
  { stage: "completed", label: "Completed" },
];

export function OnboardingProgress({ stage }: { stage: OnboardingStage }) {
  const currentIndex = STAGES.findIndex((s) => s.stage === stage);

  return (
    <ol className="space-y-2">
      {STAGES.map((item, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li
            key={item.stage}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm",
              active ? "bg-brand/10 font-medium text-brand" : done ? "text-foreground" : "text-muted"
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]",
                active
                  ? "border-brand bg-brand text-brand-foreground"
                  : done
                    ? "border-success bg-success text-white"
                    : "border-border"
              )}
            >
              {done ? "✓" : ""}
            </span>
            {item.label}
          </li>
        );
      })}
    </ol>
  );
}
