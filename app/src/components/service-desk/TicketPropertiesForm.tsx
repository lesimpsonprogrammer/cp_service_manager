"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";
import { updateTicketProperties, type ServiceDeskFormState } from "@/app/(dashboard)/tickets/actions";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_TYPES,
  TYPE_LABELS,
} from "@/lib/service-desk/constants";
import type { TicketPriority, TicketStatus, TicketType } from "@/types/database";

export interface TicketPropertiesValue {
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  client_id: string | null;
  project_id: string | null;
  category_id: string | null;
  assignee_id: string | null;
  tags: string[];
  client_visible: boolean;
}

export function TicketPropertiesForm({
  ticketId,
  value,
  clients,
  projects,
  categories,
  members,
  disabled,
}: {
  ticketId: string;
  value: TicketPropertiesValue;
  clients: { id: string; name: string }[];
  projects: { id: string; name: string; project_code: string; client_id: string }[];
  categories: { id: string; name: string; is_active: boolean }[];
  members: { userId: string; fullName: string }[];
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateTicketProperties.bind(null, ticketId),
    { error: null } as ServiceDeskFormState
  );
  const [clientId, setClientId] = useState(value.client_id ?? "");
  const clientProjects = projects.filter((p) => p.client_id === clientId);
  const assigneeMissing = value.assignee_id && !members.some((m) => m.userId === value.assignee_id);

  return (
    <form action={formAction} className="space-y-3">
      <fieldset disabled={disabled || pending} className="space-y-3">
        <div>
          <Label htmlFor="prop-subject">Subject</Label>
          <Input id="prop-subject" name="subject" defaultValue={value.subject} required minLength={3} maxLength={200} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="prop-status">Status</Label>
            <Select id="prop-status" name="status" defaultValue={value.status}>
              {TICKET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="prop-priority">Priority</Label>
            <Select id="prop-priority" name="priority" defaultValue={value.priority}>
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="prop-type">Type</Label>
            <Select id="prop-type" name="type" defaultValue={value.type}>
              {TICKET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="prop-category">Category</Label>
            <Select id="prop-category" name="category_id" defaultValue={value.category_id ?? ""}>
              <option value="">Uncategorized</option>
              {categories
                .filter((c) => c.is_active || c.id === value.category_id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="prop-assignee">Assignee</Label>
          <Select id="prop-assignee" name="assignee_id" defaultValue={value.assignee_id ?? ""}>
            <option value="">Unassigned</option>
            {assigneeMissing && <option value={value.assignee_id!}>Former teammate</option>}
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.fullName}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="prop-client">Client</Label>
          <Select id="prop-client" name="client_id" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Internal (no client)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        {clientId && (
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" name="client_visible" defaultChecked={value.client_visible} className="rounded border-border" />
            Visible in client portal
          </label>
        )}
        <div>
          <Label htmlFor="prop-project">Project</Label>
          <Select
            id="prop-project"
            name="project_id"
            key={clientId}
            defaultValue={clientId === (value.client_id ?? "") ? value.project_id ?? "" : ""}
            disabled={clientProjects.length === 0}
          >
            <option value="">{clientProjects.length ? "No specific project" : "No projects"}</option>
            {clientProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_code} · {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="prop-tags">Tags</Label>
          <Input id="prop-tags" name="tags" defaultValue={value.tags.join(", ")} placeholder="comma, separated" />
        </div>
        <Button type="submit" size="sm" className="w-full">
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </fieldset>
      {(state.error || state.success) && (
        <p className={cn("text-sm", state.error ? "text-danger" : "text-success")} role="status">
          {state.error ?? state.success}
        </p>
      )}
    </form>
  );
}
