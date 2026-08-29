"use client";

import { useTransition } from "react";
import { deleteClientRecord } from "@/app/(dashboard)/clients/actions";
import { Button } from "@/components/ui/Button";

export function DeleteClientButton({ clientId }: { clientId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this client? Linked data sources will stay but lose the client link.")) return;
        startTransition(() => deleteClientRecord(clientId));
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
