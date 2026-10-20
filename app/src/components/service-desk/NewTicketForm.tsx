"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { createTicket, type ServiceDeskFormState } from "@/app/(dashboard)/tickets/actions";
import {
  MAX_ATTACHMENTS_PER_MESSAGE,
  MAX_ATTACHMENT_BYTES,
  PRIORITY_HINTS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TICKET_PRIORITIES,
  TICKET_TYPES,
  TYPE_LABELS,
} from "@/lib/service-desk/constants";

interface Option {
  id: string;
  name: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating…" : "Create ticket"}
    </Button>
  );
}

export function NewTicketForm({
  clients,
  projects,
  categories,
  members,
  defaultClientId,
}: {
  clients: Option[];
  projects: { id: string; name: string; project_code: string; client_id: string }[];
  categories: Option[];
  members: { userId: string; fullName: string }[];
  defaultClientId: string | null;
}) {
  const [state, formAction] = useActionState(createTicket, { error: null } as ServiceDeskFormState);
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [priority, setPriority] = useState("normal");
  const clientProjects = projects.filter((p) => p.client_id === clientId);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" required minLength={3} maxLength={200} placeholder="Q3 payroll export is missing two employees" />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={7} maxLength={20000} placeholder="What happened, what was expected, steps to reproduce, affected employees/periods…" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="client_id">Client</Label>
          <Select id="client_id" name="client_id" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Internal (no client)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="project_id">Project</Label>
          <Select id="project_id" name="project_id" defaultValue="" disabled={clientProjects.length === 0} key={clientId}>
            <option value="">{clientProjects.length ? "No specific project" : "No projects for this client"}</option>
            {clientProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_code} · {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select id="priority" name="priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-muted">{PRIORITY_HINTS[priority as keyof typeof PRIORITY_HINTS]}</p>
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select id="type" name="type" defaultValue="question">
            {TICKET_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="category_id">Category</Label>
          <Select id="category_id" name="category_id" defaultValue="">
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="assignee_id">Assignee</Label>
          <Select id="assignee_id" name="assignee_id" defaultValue="">
            <option value="">Auto (category owner → client PM)</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.fullName}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="requester_name">Requester name</Label>
          <Input id="requester_name" name="requester_name" maxLength={120} placeholder="Defaults to the client's primary contact" />
        </div>
        <div>
          <Label htmlFor="requester_email">Requester email</Label>
          <Input id="requester_email" name="requester_email" type="email" placeholder="Gets reply and resolution emails" />
        </div>
        <div>
          <Label htmlFor="status">Starting status</Label>
          <Select id="status" name="status" defaultValue="new">
            {(["new", "open", "pending_client", "on_hold"] as const).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="tags">Tags</Label>
          <Input id="tags" name="tags" placeholder="payroll, q3, adp" />
        </div>
      </div>

      {clientId && (
        <label className="flex items-start gap-2 rounded-md border border-border bg-surface-2 p-3 text-sm">
          <input type="checkbox" name="client_visible" defaultChecked className="mt-0.5 rounded border-border" />
          <span>
            <span className="font-medium text-foreground">Visible to the client</span>
            <span className="block text-xs text-muted">
              Shows in their portal under Support and emails the requester. Uncheck for internal work about this client.
            </span>
          </span>
        </label>
      )}

      <div>
        <Label htmlFor="attachments">Attachments</Label>
        <input
          id="attachments"
          name="attachments"
          type="file"
          multiple
          className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-foreground"
        />
        <p className="mt-1 text-xs text-muted">
          Up to {MAX_ATTACHMENTS_PER_MESSAGE} files, {MAX_ATTACHMENT_BYTES / 1024 / 1024} MB total — images, PDF, CSV, Excel, Word, ZIP, logs.
        </p>
      </div>

      {state.error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
