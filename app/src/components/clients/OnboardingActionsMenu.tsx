"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { overrideContractStatus, purgeContractSigning, deleteContract } from "@/app/(dashboard)/clients/actions";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import type { ContractStatus, Database } from "@/types/database";

type Contract = Database["public"]["Tables"]["client_contracts"]["Row"];

const STATUS_OPTIONS: ContractStatus[] = ["draft", "sent", "signed", "active", "expired", "terminated"];

export function OnboardingActionsMenu({ clientId, contract }: { clientId: string; contract: Contract }) {
  const [pending, startTransition] = useTransition();
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<ContractStatus>(contract.status);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Link href={`/clients/${clientId}/contracts/${contract.id}/edit`}>
          <Button variant="secondary" size="sm">
            Edit
          </Button>
        </Link>
        <Button variant="secondary" size="sm" onClick={() => setOverrideOpen((v) => !v)}>
          Override
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => {
            if (
              !confirm(
                "Purge this contract's signing progress? This resets it to draft and invalidates the current signing link."
              )
            )
              return;
            startTransition(() => purgeContractSigning(clientId, contract.id));
          }}
        >
          Purge
        </Button>
        <Button
          variant="danger"
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

      {overrideOpen && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface-2 p-3">
          <Select
            value={overrideStatus}
            onChange={(e) => setOverrideStatus(e.target.value as ContractStatus)}
            className="max-w-[10rem]"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Button
            size="sm"
            disabled={pending}
            onClick={() => {
              if (
                !confirm(
                  `Manually set this contract to "${overrideStatus}"? This bypasses the normal signature workflow.`
                )
              )
                return;
              startTransition(() => {
                overrideContractStatus(clientId, contract.id, overrideStatus);
                setOverrideOpen(false);
              });
            }}
          >
            Confirm override
          </Button>
        </div>
      )}
    </div>
  );
}
