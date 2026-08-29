"use client";

import { useTransition } from "react";
import { updateOnboardingStage } from "@/app/(dashboard)/clients/actions";
import { cn } from "@/lib/utils/cn";
import type { OnboardingStage } from "@/types/database";

const STAGES: { stage: OnboardingStage; label: string }[] = [
  { stage: "not_started", label: "Not started" },
  { stage: "contract_sent", label: "Contract sent" },
  { stage: "contract_signed", label: "Contract signed" },
  { stage: "in_progress", label: "Onboarding in progress" },
  { stage: "completed", label: "Completed" },
];

export function OnboardingStageActions({
  clientId,
  stage,
}: {
  clientId: string;
  stage: OnboardingStage;
}) {
  const [pending, startTransition] = useTransition();
  const currentIndex = STAGES.findIndex((s) => s.stage === stage);

  return (
    <ol className="space-y-2">
      {STAGES.map((item, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={item.stage}>
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => updateOnboardingStage(clientId, item.stage))}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                active
                  ? "bg-brand/10 text-brand font-medium"
                  : done
                    ? "text-foreground hover:bg-surface-2"
                    : "text-muted hover:bg-surface-2"
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
            </button>
          </li>
        );
      })}
    </ol>
  );
}
