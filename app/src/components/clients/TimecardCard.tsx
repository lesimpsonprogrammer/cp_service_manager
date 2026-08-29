"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/Badge";
import { approveTimecardInternally, sendTimecardToClient, type TimecardFormState } from "@/app/(dashboard)/time/actions";
import type { Database } from "@/types/database";

type TimecardRow = Database["public"]["Tables"]["timecards"]["Row"];

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Sending…" : "Send to client"}
    </Button>
  );
}

export function TimecardCard({
  clientId,
  timecard,
  defaultApproverName,
  defaultApproverEmail,
}: {
  clientId: string;
  timecard: TimecardRow;
  defaultApproverName: string | null;
  defaultApproverEmail: string | null;
}) {
  const [approving, startApprove] = useTransition();
  const [sendState, sendAction] = useActionState(
    sendTimecardToClient.bind(null, clientId, timecard.id),
    { error: null } as TimecardFormState
  );

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {timecard.period_start} – {timecard.period_end}
          </p>
          <p className="text-xs text-muted">
            {timecard.total_hours}h
            {timecard.total_amount != null && ` · $${Number(timecard.total_amount).toLocaleString()}`}
          </p>
        </div>
        <StatusBadge status={timecard.status} />
      </div>

      {timecard.status === "draft" && (
        <Button
          size="sm"
          disabled={approving}
          onClick={() => startApprove(() => approveTimecardInternally(clientId, timecard.id))}
        >
          {approving ? "Approving…" : "Approve internally"}
        </Button>
      )}

      {timecard.status === "internally_approved" && (
        <form action={sendAction} className="space-y-3">
          <p className="text-xs text-success">
            Internally approved {timecard.internal_approval_id && `(${timecard.internal_approval_id})`}{" "}
            {timecard.internal_approved_at && `on ${new Date(timecard.internal_approved_at).toLocaleDateString()}`}.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor={`approver_name_${timecard.id}`}>Approver name</Label>
              <Input
                id={`approver_name_${timecard.id}`}
                name="approver_name"
                required
                defaultValue={defaultApproverName ?? ""}
              />
            </div>
            <div>
              <Label htmlFor={`approver_email_${timecard.id}`}>Approver email</Label>
              <Input
                id={`approver_email_${timecard.id}`}
                name="approver_email"
                type="email"
                required
                defaultValue={defaultApproverEmail ?? ""}
              />
            </div>
          </div>
          {sendState.error && (
            <p className={cn("rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
              {sendState.error}
            </p>
          )}
          <SendButton />
        </form>
      )}

      {timecard.status === "sent" && (
        <div className="space-y-1 text-sm">
          <p className="text-muted">
            Awaiting response from <span className="text-foreground">{timecard.approver_email}</span>
            {timecard.sent_at && ` — sent ${new Date(timecard.sent_at).toLocaleString()}`}.
          </p>
          <a
            href={`/timecard/${timecard.approval_token}`}
            target="_blank"
            rel="noreferrer"
            className="text-brand hover:underline"
          >
            Open review link ↗
          </a>
        </div>
      )}

      {timecard.status === "client_approved" && (
        <p className="text-sm text-foreground">
          Approved by {timecard.client_approved_by_name}
          {timecard.client_approved_at && ` on ${new Date(timecard.client_approved_at).toLocaleString()}`}.
        </p>
      )}

      {timecard.status === "client_rejected" && (
        <p className="text-sm text-danger">
          Rejected{timecard.rejection_reason && `: ${timecard.rejection_reason}`}
        </p>
      )}
    </div>
  );
}
