"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { approveTimecard, rejectTimecard, type TimecardDecisionState } from "@/app/timecard/[token]/actions";

const initialState: TimecardDecisionState = { error: null };

function SubmitButton({
  label,
  pendingLabel,
  variant,
}: {
  label: string;
  pendingLabel: string;
  variant?: "primary" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function TimecardDecisionForm({ token }: { token: string }) {
  const [mode, setMode] = useState<"approve" | "reject" | null>(null);
  const [approveState, approveAction] = useActionState(approveTimecard.bind(null, token), initialState);
  const [rejectState, rejectAction] = useActionState(rejectTimecard.bind(null, token), initialState);

  if (mode === "approve") {
    return (
      <form action={approveAction} className="space-y-3">
        <div>
          <Label htmlFor="typed_name">Type your full name to approve</Label>
          <Input id="typed_name" name="typed_name" required placeholder="Jane Doe" />
        </div>
        {approveState.error && (
          <p className={cn("rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
            {approveState.error}
          </p>
        )}
        <div className="flex gap-2">
          <SubmitButton label="Confirm approval" pendingLabel="Approving…" />
          <Button type="button" variant="ghost" onClick={() => setMode(null)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  if (mode === "reject") {
    return (
      <form action={rejectAction} className="space-y-3">
        <div>
          <Label htmlFor="reason">Reason</Label>
          <Textarea id="reason" name="reason" rows={3} required placeholder="What needs to change?" />
        </div>
        {rejectState.error && (
          <p className={cn("rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
            {rejectState.error}
          </p>
        )}
        <div className="flex gap-2">
          <SubmitButton label="Submit rejection" pendingLabel="Submitting…" variant="danger" />
          <Button type="button" variant="ghost" onClick={() => setMode(null)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex gap-2">
      <Button onClick={() => setMode("approve")}>Approve</Button>
      <Button variant="danger" onClick={() => setMode("reject")}>
        Reject
      </Button>
    </div>
  );
}
