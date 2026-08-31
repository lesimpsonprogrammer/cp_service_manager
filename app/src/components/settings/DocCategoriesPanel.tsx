"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { createDocCategory, deleteDocCategory, type SettingsFormState } from "@/app/(dashboard)/settings/actions";

export interface DocCategoryRow {
  id: string;
  name: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Adding…" : "Add category"}
    </Button>
  );
}

export function DocCategoriesPanel({ categories }: { categories: DocCategoryRow[] }) {
  const [state, formAction] = useActionState(createDocCategory, { error: null } as SettingsFormState);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {categories.length > 0 ? (
        <ul className="divide-y divide-border">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="font-medium text-foreground">{category.name}</span>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => {
                  if (!confirm(`Delete category "${category.name}"? Docs already using it keep the label.`)) return;
                  startTransition(() => deleteDocCategory(category.id));
                }}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-2 text-sm text-muted">No categories yet — add one below.</p>
      )}

      <form action={formAction} className="flex items-end gap-2 px-5 pb-4">
        <div className="flex-1">
          <Label htmlFor="doc_category_name">New category</Label>
          <Input id="doc_category_name" name="name" required placeholder="Runbooks" />
        </div>
        <SubmitButton />
      </form>
      {state.error && (
        <p className={cn("mx-5 mb-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
          {state.error}
        </p>
      )}
    </div>
  );
}
