"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";
import {
  createTicketCategory,
  createTicketMacro,
  deleteTicketCategory,
  deleteTicketMacro,
  saveSlaPolicies,
  setTicketCategoryActive,
  type ServiceDeskFormState,
} from "@/app/(dashboard)/tickets/actions";
import { PRIORITY_LABELS, TICKET_PRIORITIES } from "@/lib/service-desk/constants";
import type { TicketPriority } from "@/types/database";

function FormMessage({ state }: { state: ServiceDeskFormState }) {
  if (!state.error && !state.success) return null;
  return (
    <p className={cn("text-sm", state.error ? "text-danger" : "text-success")} role="status">
      {state.error ?? state.success}
    </p>
  );
}

const hours = (minutes: number) => Math.round((minutes / 60) * 100) / 100;

export function SlaPoliciesForm({
  policies,
  editable,
}: {
  policies: Record<TicketPriority, { firstResponse: number; resolution: number; custom: boolean }>;
  editable: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveSlaPolicies, { error: null } as ServiceDeskFormState);
  return (
    <form action={formAction} className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2 pr-3 font-medium">Priority</th>
              <th className="py-2 pr-3 font-medium">First response (hours)</th>
              <th className="py-2 font-medium">Resolution (hours)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {TICKET_PRIORITIES.map((p) => (
              <tr key={p}>
                <td className="py-2 pr-3 font-medium text-foreground">
                  {PRIORITY_LABELS[p]}
                  {!policies[p].custom && <span className="ml-2 text-xs font-normal text-muted">default</span>}
                </td>
                <td className="py-2 pr-3">
                  <Input
                    type="number"
                    step="0.25"
                    min="0.1"
                    name={`${p}_first_response_hours`}
                    defaultValue={hours(policies[p].firstResponse)}
                    disabled={!editable}
                    className="h-8 w-28"
                    aria-label={`${PRIORITY_LABELS[p]} first response hours`}
                  />
                </td>
                <td className="py-2">
                  <Input
                    type="number"
                    step="0.25"
                    min="0.1"
                    name={`${p}_resolution_hours`}
                    defaultValue={hours(policies[p].resolution)}
                    disabled={!editable}
                    className="h-8 w-28"
                    aria-label={`${PRIORITY_LABELS[p]} resolution hours`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        Clocks run 24/7 and pause while a ticket is “Waiting on client” or “On hold”. New targets apply to new tickets and whenever a ticket’s priority changes.
      </p>
      {editable && (
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save SLA targets"}
        </Button>
      )}
      <FormMessage state={state} />
    </form>
  );
}

export function CategoriesPanel({
  categories,
  members,
  editable,
}: {
  categories: { id: string; name: string; description: string | null; default_assignee_id: string | null; is_active: boolean }[];
  members: { userId: string; fullName: string }[];
  editable: boolean;
}) {
  const [state, formAction, pending] = useActionState(createTicketCategory, { error: null } as ServiceDeskFormState);
  const [rowPending, startTransition] = useTransition();
  const memberName = (id: string | null) => (id ? members.find((m) => m.userId === id)?.fullName ?? "Former teammate" : null);

  return (
    <div className="space-y-4">
      {categories.length > 0 ? (
        <ul className="divide-y divide-border">
          {categories.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <div className="min-w-0">
                <p className={cn("font-medium", c.is_active ? "text-foreground" : "text-muted line-through")}>{c.name}</p>
                <p className="text-xs text-muted">
                  {memberName(c.default_assignee_id) ? `Routes to ${memberName(c.default_assignee_id)}` : "No default owner"}
                  {c.description ? ` · ${c.description}` : ""}
                </p>
              </div>
              {editable && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={rowPending}
                    onClick={() => startTransition(() => setTicketCategoryActive(c.id, !c.is_active))}
                  >
                    {c.is_active ? "Retire" : "Restore"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={rowPending}
                    onClick={() => {
                      if (!confirm(`Delete "${c.name}"? Tickets in it become uncategorized. Retiring keeps history intact.`)) return;
                      startTransition(() => deleteTicketCategory(c.id));
                    }}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No categories yet. Categories let clients pick a topic and route tickets to the right owner.</p>
      )}

      {editable && (
        <form action={formAction} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" name="name" required maxLength={80} placeholder="Payroll processing" />
          </div>
          <div>
            <Label htmlFor="cat-owner">Default owner</Label>
            <Select id="cat-owner" name="default_assignee_id" defaultValue="">
              <option value="">None (falls back to client PM)</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.fullName}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="cat-desc">Description (shown to clients)</Label>
            <Input id="cat-desc" name="description" maxLength={500} placeholder="Pay runs, garnishments, off-cycle checks" />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Adding…" : "Add category"}
            </Button>
            <FormMessage state={state} />
          </div>
        </form>
      )}
    </div>
  );
}

export function MacrosPanel({ macros, editable }: { macros: { id: string; name: string; body: string }[]; editable: boolean }) {
  const [state, formAction, pending] = useActionState(createTicketMacro, { error: null } as ServiceDeskFormState);
  const [rowPending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {macros.length > 0 ? (
        <ul className="divide-y divide-border">
          {macros.map((m) => (
            <li key={m.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{m.name}</p>
                <p className="line-clamp-2 whitespace-pre-wrap text-xs text-muted">{m.body}</p>
              </div>
              {editable && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={rowPending}
                  onClick={() => {
                    if (!confirm(`Delete macro "${m.name}"?`)) return;
                    startTransition(() => deleteTicketMacro(m.id));
                  }}
                >
                  Delete
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No macros yet. Save replies you send often and insert them from any ticket.</p>
      )}

      {editable && (
        <form action={formAction} className="space-y-3 border-t border-border pt-4">
          <div>
            <Label htmlFor="macro-name">Name</Label>
            <Input id="macro-name" name="name" required maxLength={80} placeholder="Request missing pay stub" />
          </div>
          <div>
            <Label htmlFor="macro-body">Reply text</Label>
            <Textarea
              id="macro-body"
              name="body"
              required
              rows={5}
              placeholder={"Hi {{requester_name}},\n\nThanks for the details on {{ticket_number}}. Could you send…\n\n— {{agent_name}}"}
            />
            <p className="mt-1 text-xs text-muted">
              Placeholders: {"{{requester_name}}"}, {"{{ticket_number}}"}, {"{{subject}}"}, {"{{client_name}}"}, {"{{agent_name}}"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving…" : "Save macro"}
            </Button>
            <FormMessage state={state} />
          </div>
        </form>
      )}
    </div>
  );
}
