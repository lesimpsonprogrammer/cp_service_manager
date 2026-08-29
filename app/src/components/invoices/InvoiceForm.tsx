"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { createInvoice, type InvoiceFormState } from "@/app/(dashboard)/invoices/actions";

interface Contract {
  id: string;
  name: string;
}

interface LineItemDraft {
  key: number;
  description: string;
  quantity: string;
  unit_price: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating…" : "Create invoice"}
    </Button>
  );
}

export function InvoiceForm({
  clientId,
  contracts,
  defaultBillingContactName,
  defaultBillingContactEmail,
}: {
  clientId: string;
  contracts: Contract[];
  defaultBillingContactName: string | null;
  defaultBillingContactEmail: string | null;
}) {
  const [state, formAction] = useActionState(createInvoice.bind(null, clientId), { error: null } as InvoiceFormState);
  const [items, setItems] = useState<LineItemDraft[]>([{ key: 0, description: "", quantity: "1", unit_price: "" }]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { key: Math.max(...prev.map((item) => item.key)) + 1, description: "", quantity: "1", unit_price: "" },
    ]);
  };

  const removeItem = (key: number) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.key !== key) : prev));
  };

  const updateItem = (key: number, field: keyof Omit<LineItemDraft, "key">, value: string) => {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)));
  };

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label>Line items</Label>
        {items.map((item) => (
          <div key={item.key} className="grid grid-cols-[1fr_80px_110px_auto] items-start gap-2">
            <Input
              name="description"
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateItem(item.key, "description", e.target.value)}
              required
            />
            <Input
              name="quantity"
              type="number"
              min="0"
              step="0.01"
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => updateItem(item.key, "quantity", e.target.value)}
              required
            />
            <Input
              name="unit_price"
              type="number"
              min="0"
              step="0.01"
              placeholder="Unit price"
              value={item.unit_price}
              onChange={(e) => updateItem(item.key, "unit_price", e.target.value)}
              required
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.key)}>
              ✕
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={addItem}>
          + Add line item
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="due_date">Due date</Label>
          <Input id="due_date" name="due_date" type="date" />
        </div>
        <div>
          <Label htmlFor="tax_rate">Tax rate (%)</Label>
          <Input id="tax_rate" name="tax_rate" type="number" min="0" step="0.01" defaultValue="0" />
        </div>
        <div>
          <Label htmlFor="contract_id">Contract</Label>
          <Select id="contract_id" name="contract_id" defaultValue="">
            <option value="">None</option>
            {contracts.map((contract) => (
              <option key={contract.id} value={contract.id}>
                {contract.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="billing_contact_name">Billing contact name</Label>
          <Input
            id="billing_contact_name"
            name="billing_contact_name"
            defaultValue={defaultBillingContactName ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="billing_contact_email">Billing contact email</Label>
          <Input
            id="billing_contact_email"
            name="billing_contact_email"
            type="email"
            defaultValue={defaultBillingContactEmail ?? ""}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} placeholder="Optional notes printed on the invoice" />
      </div>

      {state.error && (
        <p className={cn("rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
