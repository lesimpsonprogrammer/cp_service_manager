"use client";

import { useTransition } from "react";
import { deleteDataSource } from "@/app/(dashboard)/data-sources/actions";
import { Button } from "@/components/ui/Button";

export function DeleteDataSourceButton({ dataSourceId }: { dataSourceId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this data source? Pipelines using it will stop working.")) return;
        startTransition(() => deleteDataSource(dataSourceId));
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
