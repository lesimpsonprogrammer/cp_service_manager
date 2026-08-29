"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { createInvoiceFromTimecard } from "@/app/(dashboard)/invoices/actions";

interface TimecardSummary {
  id: string;
  period_start: string;
  period_end: string;
  total_hours: number;
  total_amount: number | null;
}

export function GenerateInvoiceFromTimecard({ clientId, timecard }: { clientId: string; timecard: TimecardSummary }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm">
      <div>
        <p className="text-foreground">
          {timecard.period_start} – {timecard.period_end}
        </p>
        <p className="text-xs text-muted">
          {timecard.total_hours}h
          {timecard.total_amount != null && ` · $${Number(timecard.total_amount).toLocaleString()}`}
        </p>
      </div>
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() => startTransition(() => createInvoiceFromTimecard(clientId, timecard.id))}
      >
        {pending ? "Generating…" : "Create invoice"}
      </Button>
    </div>
  );
}
