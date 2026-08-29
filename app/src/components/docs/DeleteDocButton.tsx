"use client";

import { useTransition } from "react";
import { deleteDoc } from "@/app/(dashboard)/docs/actions";
import { Button } from "@/components/ui/Button";

export function DeleteDocButton({ docId }: { docId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this doc?")) return;
        startTransition(() => deleteDoc(docId));
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
