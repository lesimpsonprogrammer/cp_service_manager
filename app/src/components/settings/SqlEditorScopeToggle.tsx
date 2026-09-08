"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils/cn";
import { setSqlEditorLockOrgScope } from "@/app/(dashboard)/settings/actions";

export function SqlEditorScopeToggle({ locked: initialLocked }: { locked: boolean }) {
  const [locked, setLocked] = useState(initialLocked);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !locked;
    setLocked(next);
    setError(null);
    startTransition(async () => {
      const result = await setSqlEditorLockOrgScope(next);
      if (result.error) {
        setLocked(!next);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-foreground">Lock SQL Editor to org-wide</p>
        <p className="text-xs text-muted">
          When on, the SQL Editor&apos;s client dropdown is disabled and every query always runs across the
          whole organization — nobody can narrow it down to a single client.
        </p>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={locked}
        onClick={toggle}
        disabled={isPending}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-50",
          locked ? "border-brand bg-brand" : "border-border bg-surface-2"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            locked ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}
