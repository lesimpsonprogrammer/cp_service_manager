"use client";

import { useTransition } from "react";
import { updateClientStatus } from "@/app/(dashboard)/clients/actions";
import { Button } from "@/components/ui/Button";
import type { ClientStatus } from "@/types/database";

const NEXT_STATUS: Record<ClientStatus, { label: string; status: ClientStatus }[]> = {
  prospect: [{ label: "Mark active", status: "active" }, { label: "Mark inactive", status: "inactive" }],
  active: [{ label: "Mark inactive", status: "inactive" }],
  inactive: [{ label: "Reactivate", status: "active" }],
};

export function ClientStatusActions({ clientId, status }: { clientId: string; status: ClientStatus }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {NEXT_STATUS[status].map((option) => (
        <Button
          key={option.status}
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => updateClientStatus(clientId, option.status))}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
