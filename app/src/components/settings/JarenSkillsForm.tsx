"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { updateJarenSkills, type SettingsFormState } from "@/app/(dashboard)/settings/actions";
import type { EssentialSkill, EnhancedSkill } from "@/lib/jaren/agent";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : "Save duties"}
    </Button>
  );
}

export function JarenSkillsForm({
  essentialOptions,
  enhancedOptions,
  activeEssential,
  activeEnhanced,
}: {
  essentialOptions: { value: EssentialSkill; label: string }[];
  enhancedOptions: { value: EnhancedSkill; label: string }[];
  activeEssential: string[];
  activeEnhanced: string[];
}) {
  const [state, formAction] = useActionState(updateJarenSkills, { error: null } as SettingsFormState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <p className="mb-2 text-foreground">Essential duties</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {essentialOptions.map((opt) => (
            <label key={opt.value} className="flex items-center gap-1.5 text-xs text-muted">
              <input
                type="checkbox"
                name="essential"
                value={opt.value}
                defaultChecked={activeEssential.includes(opt.value)}
                className="accent-brand"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-foreground">Enhanced duties</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {enhancedOptions.map((opt) => (
            <label key={opt.value} className="flex items-center gap-1.5 text-xs text-muted">
              <input
                type="checkbox"
                name="enhanced"
                value={opt.value}
                defaultChecked={activeEnhanced.includes(opt.value)}
                className="accent-brand"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {state.error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

function ReadOnlySkills({
  label,
  options,
  active,
  tone,
}: {
  label: string;
  options: { value: string; label: string }[];
  active: string[];
  tone: "brand" | "neutral";
}) {
  return (
    <div>
      <p className={cn("mb-2 text-foreground")}>{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options
          .filter((opt) => active.includes(opt.value))
          .map((opt) => (
            <span
              key={opt.value}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                tone === "brand" ? "bg-brand/10 text-brand" : "bg-surface-2 text-muted"
              )}
            >
              {opt.label}
            </span>
          ))}
      </div>
    </div>
  );
}

export function JarenSkillsReadOnly({
  essentialOptions,
  enhancedOptions,
  activeEssential,
  activeEnhanced,
}: {
  essentialOptions: { value: EssentialSkill; label: string }[];
  enhancedOptions: { value: EnhancedSkill; label: string }[];
  activeEssential: string[];
  activeEnhanced: string[];
}) {
  return (
    <div className="space-y-4">
      <ReadOnlySkills label="Essential duties" options={essentialOptions} active={activeEssential} tone="brand" />
      <ReadOnlySkills label="Enhanced duties" options={enhancedOptions} active={activeEnhanced} tone="neutral" />
    </div>
  );
}
