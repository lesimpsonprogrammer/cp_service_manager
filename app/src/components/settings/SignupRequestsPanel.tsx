"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { approveSignupRequest, rejectSignupRequest, type SettingsFormState } from "@/app/(dashboard)/settings/actions";

export interface SignupRequestRow {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  created_at: string;
}

function ApproveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Approving…" : "Approve"}
    </Button>
  );
}

function RequestRow({ request }: { request: SignupRequestRow }) {
  const [state, formAction] = useActionState(
    approveSignupRequest.bind(null, request.id),
    { error: null } as SettingsFormState
  );
  const [rejecting, startTransition] = useTransition();

  return (
    <li className="space-y-2 px-5 py-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-medium text-foreground">{request.email}</span>
          {request.full_name && <span className="ml-2 text-muted">{request.full_name}</span>}
          {request.company_name && <p className="text-xs text-muted">{request.company_name}</p>}
          <p className="text-xs text-muted">Requested {new Date(request.created_at).toLocaleDateString()}</p>
        </div>
        <form action={formAction} className="flex items-center gap-2">
          <Select name="role" defaultValue="member" className="h-8 w-28 text-xs">
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </Select>
          <ApproveButton />
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={rejecting}
            onClick={() => startTransition(() => rejectSignupRequest(request.id))}
          >
            Reject
          </Button>
        </form>
      </div>
      {state.error && (
        <p className={cn("rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
          {state.error}
        </p>
      )}
    </li>
  );
}

export function SignupRequestsPanel({ requests }: { requests: SignupRequestRow[] }) {
  if (requests.length === 0) {
    return <p className="px-5 py-3 text-sm text-muted">No pending signup requests.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {requests.map((request) => (
        <RequestRow key={request.id} request={request} />
      ))}
    </ul>
  );
}
