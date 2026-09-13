"use client";

import { useMemo, useState, useTransition } from "react";
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
  agreement_number: string;
  contract_number: string;
  name: string;
  status: ContractStatus;
  start_date: string | null;
  end_date: string | null;
  value: number | null;
}

export function ContractsList({
  clientId,
  clientNumber,
  contracts,
}: {
  clientId: string;
  clientNumber: string | null;
  contracts: ContractRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const filteredContracts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return contracts;

    return contracts.filter((contract) =>
      [contract.agreement_number, contract.contract_number, contract.name, contract.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [contracts, search]);

  if (contracts.length === 0) {
    return <p className="px-5 py-4 text-sm text-muted">No agreements on file yet.</p>;
  }

  return (
    <div>
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="min-w-[280px] flex-1 space-y-1 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">Search agreements</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Agreement ID, name, status, or legacy contract number"
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-foreground placeholder:text-muted focus:border-brand focus:outline-none"
            />
          </label>
          {clientNumber && (
            <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
              Client ID <span className="ml-1 font-mono font-medium text-foreground">{clientNumber}</span>
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-muted">
          Showing {filteredContracts.length} of {contracts.length} agreement{contracts.length === 1 ? "" : "s"}.
        </p>
      </div>

      {filteredContracts.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">No agreements match “{search}”.</p>
      ) : (
        <ul className="divide-y divide-border">
          {filteredContracts.map((contract) => {
            const nextAction = NEXT_STATUS[contract.status];
            return (
              <li key={contract.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-brand">{contract.agreement_number}</span>
                    <p className="font-medium text-foreground">{contract.name}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {contract.start_date ?? "No start date"} – {contract.end_date ?? "No end date"}
                    {contract.value != null && ` · $${Number(contract.value).toLocaleString()}/yr`}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-muted">Legacy: {contract.contract_number}</p>
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
                      if (!confirm("Delete this agreement?")) return;
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
      )}
    </div>
  );
}
