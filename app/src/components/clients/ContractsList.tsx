"use client";

import { useTransition } from "react";
import Link from "next/link";
import { updateContractStatus, deleteContract } from "@/app/(dashboard)/clients/actions";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import type { ContractStatus } from "@/types/database";

const NEXT_STATUS: Partial<Record<ContractStatus, { label: string; status: ContractStatus }>> = {
  draft: { label: "Mark sent", status: "sent" },
  sent: { label: "Mark signed", status: "signed" },
  signed: { label: "Activate", status: "active" },
  active: { label: "Mark expired", status: "expired" },
};

export interface ContractRow {
  id: string;
  name: string;
  status: ContractStatus;
  start_date: string | null;
  end_date: string | null;
  value: number | null;
}

export function ContractsList({ clientId, contracts }: { clientId: string; contracts: ContractRow[] }) {
  const [pending, startTransition] = useTransition();

  if (contracts.length === 0) {
    return <p className="px-5 py-4 text-sm text-muted">No contracts on file yet.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {contracts.map((contract) => {
        const nextAction = NEXT_STATUS[contract.status];
        return (
          <li key={contract.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
            <div>
              <p className="font-medium text-foreground">{contract.name}</p>
              <p className="text-xs text-muted">
                {contract.start_date ?? "No start date"} – {contract.end_date ?? "No end date"}
                {contract.value != null && ` · $${Number(contract.value).toLocaleString()}/yr`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={contract.status} />
              <a
                href={`/clients/${clientId}/contracts/${contract.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand hover:underline"
              >
                PDF
              </a>
              <Link
                href={`/clients/${clientId}/contracts/${contract.id}/edit`}
                className="text-xs text-brand hover:underline"
              >
                Edit
              </Link>
              {nextAction && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    startTransition(() => updateContractStatus(clientId, contract.id, nextAction.status))
                  }
                >
                  {nextAction.label}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => {
                  if (!confirm("Delete this contract?")) return;
                  startTransition(() => deleteContract(clientId, contract.id));
                }}
              >
                Delete
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
