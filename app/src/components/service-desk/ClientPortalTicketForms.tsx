"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";
import {
  createClientTicket,
  rateTicket,
  replyAsClient,
  setTicketStatusAsClient,
  type PortalFormState,
} from "@/app/client/(portal)/support/actions";
import {
  MAX_ATTACHMENTS_PER_MESSAGE,
  MAX_ATTACHMENT_BYTES,
  PRIORITY_HINTS,
  PRIORITY_LABELS,
  TICKET_PRIORITIES,
  TICKET_TYPES,
  TYPE_LABELS,
} from "@/lib/service-desk/constants";

const fileInputClass =
  "block w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-foreground";

function Message({ state }: { state: PortalFormState }) {
  if (!state.error && !state.success) return null;
  return (
    <p
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        state.error ? "border-danger/30 bg-danger/10 text-danger" : "border-success/30 bg-success/10 text-success"
      )}
      role="status"
    >
      {state.error ?? state.success}
    </p>
  );
}

function Submit({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? busy : idle}
    </Button>
  );
}

export function ClientNewTicketForm({
  categories,
  projects,
}: {
  categories: { id: string; name: string; description: string | null }[];
  projects: { id: string; name: string; project_code: string }[];
}) {
  const [state, formAction] = useActionState(createClientTicket, { error: null } as PortalFormState);
  const [priority, setPriority] = useState("normal");

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" required minLength={3} maxLength={200} placeholder="Short summary of what you need" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="type">What kind of request?</Label>
          <Select id="type" name="type" defaultValue="question">
            {TICKET_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">How urgent?</Label>
          <Select id="priority" name="priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-muted">{PRIORITY_HINTS[priority as keyof typeof PRIORITY_HINTS]}</p>
        </div>
        {categories.length > 0 && (
          <div>
            <Label htmlFor="category_id">Topic</Label>
            <Select id="category_id" name="category_id" defaultValue="">
              <option value="">Not sure / other</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} title={c.description ?? undefined}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        )}
        {projects.length > 0 && (
          <div>
            <Label htmlFor="project_id">Related project</Label>
            <Select id="project_id" name="project_id" defaultValue="">
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_code} · {p.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
      <div>
        <Label htmlFor="description">Details</Label>
        <Textarea
          id="description"
          name="description"
          required
          minLength={10}
          rows={8}
          maxLength={20000}
          placeholder="What happened, what you expected, and anything we should know (pay period, employee IDs, error messages)…"
        />
        <p className="mt-1 text-xs text-muted">Please don&apos;t include full SSNs or bank account numbers — we&apos;ll ask through a secure channel if needed.</p>
      </div>
      <div>
        <Label htmlFor="attachments">Attachments (optional)</Label>
        <input id="attachments" name="attachments" type="file" multiple className={fileInputClass} />
        <p className="mt-1 text-xs text-muted">
          Up to {MAX_ATTACHMENTS_PER_MESSAGE} files, {MAX_ATTACHMENT_BYTES / 1024 / 1024} MB total — screenshots, PDF, CSV, Excel, Word.
        </p>
      </div>
      <Message state={state} />
      <div className="flex justify-end">
        <Submit idle="Submit request" busy="Submitting…" />
      </div>
    </form>
  );
}

export function ClientReplyForm({ ticketId, resolved }: { ticketId: string; resolved: boolean }) {
  const [formKey, setFormKey] = useState(0);
  const [state, formAction] = useActionState(async (prev: PortalFormState, formData: FormData) => {
    const result = await replyAsClient(ticketId, prev, formData);
    if (!result.error) setFormKey((k) => k + 1);
    return result;
  }, { error: null } as PortalFormState);

  return (
    <form key={formKey} action={formAction} className="space-y-3 rounded-card border border-border bg-surface p-4 shadow-panel">
      <Label htmlFor="client-reply">{resolved ? "Still need help? Reply to reopen" : "Add a reply"}</Label>
      <Textarea id="client-reply" name="body" required rows={5} maxLength={20000} placeholder="Type your message…" />
      <input name="attachments" type="file" multiple className={fileInputClass} aria-label="Attach files" />
      <Message state={state} />
      <div className="flex justify-end">
        <Submit idle={resolved ? "Reply & reopen" : "Send reply"} busy="Sending…" />
      </div>
    </form>
  );
}

export function ClientStatusButton({ ticketId, action }: { ticketId: string; action: "close" | "reopen" }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (action === "close" && !confirm("Close this request? You won't be able to reply to it afterwards.")) return;
          startTransition(async () => {
            const result = await setTicketStatusAsClient(ticketId, action);
            setError(result.error);
          });
        }}
      >
        {action === "close" ? "Close request" : "Reopen"}
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function ClientRatingForm({ ticketId }: { ticketId: string }) {
  const [state, formAction] = useActionState(rateTicket.bind(null, ticketId), { error: null } as PortalFormState);
  const [rating, setRating] = useState(0);

  if (state.success) return <Message state={state} />;

  return (
    <form action={formAction} className="space-y-3 rounded-card border border-border bg-surface p-4 shadow-panel">
      <p className="text-sm font-medium text-foreground">How did we do?</p>
      <input type="hidden" name="rating" value={rating || ""} />
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => setRating(n)}
            className={cn("text-2xl leading-none transition-colors", n <= rating ? "text-warning" : "text-muted hover:text-warning/70")}
          >
            ★
          </button>
        ))}
      </div>
      <Textarea name="comment" rows={3} maxLength={2000} placeholder="Anything we could do better? (optional)" />
      <Message state={state} />
      <Button type="submit" size="sm" disabled={!rating}>
        Send feedback
      </Button>
    </form>
  );
}
