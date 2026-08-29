"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import {
  sendInvoiceToClient,
  markInvoicePaid,
  markInvoiceOverdue,
  voidInvoice,
  deleteInvoice,
  type InvoiceFormState,
} from "@/app/(dashboard)/invoices/actions";
import type { Database } from "@/types/database";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Sending…" : "Send to client"}
    </Button>
  );
}

export function InvoiceActions({
  clientId,
  invoice,
  clientName,
}: {
  clientId: string;
  invoice: InvoiceRow;
  clientName: string;
}) {
  const [pending, startTransition] = useTransition();
  const [sendState, sendAction] = useActionState(
    sendInvoiceToClient.bind(null, clientId, invoice.id),
    { error: null } as InvoiceFormState
  );

  const pdfUrl = `/clients/${clientId}/invoices/${invoice.id}/pdf`;

  return (
    <div className="space-y-4">
      <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-sm text-brand hover:underline">
        View PDF ↗
      </a>

      {invoice.status === "draft" && (
        <form action={sendAction} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="billing_contact_name">Billing contact name</Label>
              <Input
                id="billing_contact_name"
                name="billing_contact_name"
                required
                defaultValue={invoice.billing_contact_name ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="billing_contact_email">Billing contact email</Label>
              <Input
                id="billing_contact_email"
                name="billing_contact_email"
                type="email"
                required
                defaultValue={invoice.billing_contact_email ?? ""}
              />
            </div>
          </div>
          {sendState.error && (
            <p className={cn("rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
              {sendState.error}
            </p>
          )}
          <div className="flex items-center gap-2">
            <SendButton />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => startTransition(() => deleteInvoice(clientId, invoice.id))}
            >
              Delete draft
            </Button>
          </div>
        </form>
      )}

      {(invoice.status === "sent" || invoice.status === "overdue") && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="w-full text-sm text-muted">
            Sent to <span className="text-foreground">{invoice.billing_contact_email}</span> for {clientName}
            {invoice.sent_at && ` on ${new Date(invoice.sent_at).toLocaleDateString()}`}.
          </p>
          <Button
            size="sm"
            disabled={pending}
            onClick={() => startTransition(() => markInvoicePaid(clientId, invoice.id))}
          >
            Mark as paid
          </Button>
          {invoice.status === "sent" && (
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => startTransition(() => markInvoiceOverdue(clientId, invoice.id))}
            >
              Mark overdue
            </Button>
          )}
          <Button
            size="sm"
            variant="danger"
            disabled={pending}
            onClick={() => startTransition(() => voidInvoice(clientId, invoice.id))}
          >
            Void
          </Button>
        </div>
      )}

      {invoice.status === "paid" && (
        <p className="text-sm text-success">
          Paid{invoice.paid_at && ` on ${new Date(invoice.paid_at).toLocaleDateString()}`}.
        </p>
      )}

      {invoice.status === "void" && <p className="text-sm text-muted">This invoice has been voided.</p>}
    </div>
  );
}
