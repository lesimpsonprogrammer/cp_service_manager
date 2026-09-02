"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { approveTimecardInternally } from "@/app/(dashboard)/time/actions";

export function QuickApproveTimecardButton({ clientId, timecardId }: { clientId: string; timecardId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() => startTransition(() => approveTimecardInternally(clientId, timecardId))}
    >
      {pending ? "Approving…" : "Approve"}
    </Button>
  );
}
