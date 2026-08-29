"use client";

import { useTransition } from "react";
import { deleteTemplate } from "@/app/(dashboard)/templates/actions";
import { Button } from "@/components/ui/Button";

export function DeleteTemplateButton({ templateId }: { templateId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this template? Existing contracts already created from it are unaffected.")) return;
        startTransition(() => deleteTemplate(templateId));
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
