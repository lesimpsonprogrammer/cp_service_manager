"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { approveContract, sendContractForSignature, sendContractReminderNow } from "@/app/(dashboard)/clients/actions";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import type { Database } from "@/types/database";

type Contract = Database["public"]["Tables"]["client_contracts"]["Row"];

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Sending…" : "Send for signature"}
    </Button>
  );
}

export function ContractSigningPanel({
  clientId,
  contract,
  defaultSignerName,
  defaultSignerEmail,
}: {
  clientId: string;
  contract: Contract;
  defaultSignerName: string | null;
  defaultSignerEmail: string | null;
}) {
  const [approving, startApprove] = useTransition();
  const [reminding, startReminder] = useTransition();
  const [state, formAction] = useActionState(sendContractForSignature.bind(null, clientId, contract.id), {
    error: null,
  });

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{contract.name}</p>
          {contract.value != null && (
            <p className="text-xs text-muted">${Number(contract.value).toLocaleString()}/yr</p>
          )}
        </div>
        <StatusBadge status={contract.status} />
      </div>

      {!contract.approved_at && contract.status === "draft" && (
        <Button
          size="sm"
          disabled={approving}
          onClick={() => startApprove(() => approveContract(clientId, contract.id))}
        >
          {approving ? "Approving…" : "Approve contract"}
        </Button>
      )}

      {contract.approved_at && contract.status === "draft" && (
        <form action={formAction} className="space-y-3">
          <p className="text-xs text-success">
            Approved {new Date(contract.approved_at).toLocaleDateString()} — ready to send.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="signer_name">Signer name</Label>
              <Input
                id="signer_name"
                name="signer_name"
                required
                defaultValue={contract.signer_name ?? defaultSignerName ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="signer_email">Signer email</Label>
              <Input
                id="signer_email"
                name="signer_email"
                type="email"
                required
                defaultValue={contract.signer_email ?? defaultSignerEmail ?? ""}
              />
            </div>
          </div>
          {state.error && (
            <p className={cn("rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
              {state.error}
            </p>
          )}
          <SendButton />
        </form>
      )}

      {contract.status === "sent" && (
        <div className="space-y-2 text-sm">
          <p className="text-muted">
            Awaiting signature from <span className="text-foreground">{contract.signer_email}</span>
            {contract.sent_at && ` — sent ${new Date(contract.sent_at).toLocaleString()}`}.
          </p>
          {contract.reminder_count > 0 && (
            <p className="text-xs text-muted">
              {contract.reminder_count} reminder{contract.reminder_count === 1 ? "" : "s"} sent
              {contract.last_reminder_at && ` — last on ${new Date(contract.last_reminder_at).toLocaleDateString()}`}.
              An automatic reminder also goes out every few days until it&apos;s signed.
            </p>
          )}
          <div className="flex items-center gap-3">
            <a href={`/sign/${contract.signing_token}`} target="_blank" rel="noreferrer" className="text-brand hover:underline">
              Open signing link ↗
            </a>
            <Button
              variant="secondary"
              size="sm"
              disabled={reminding}
              onClick={() => startReminder(() => sendContractReminderNow(clientId, contract.id))}
            >
              {reminding ? "Sending…" : "Send reminder now"}
            </Button>
          </div>
        </div>
      )}

      {(contract.status === "signed" || contract.status === "active") && (
        <div className="space-y-1 text-sm">
          <p className="text-foreground">
            Signed by <span className="font-medium">{contract.signed_by_name}</span>
            {contract.signed_at && ` on ${new Date(contract.signed_at).toLocaleString()}`}
          </p>
          {contract.signer_ip && <p className="text-xs text-muted">IP address: {contract.signer_ip}</p>}
          <a
            href={`/clients/${clientId}/contracts/${contract.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="text-brand hover:underline"
          >
            View signed PDF ↗
          </a>
        </div>
      )}
    </div>
  );
}
