"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import {
  inviteClientPortalUser,
  revokeClientPortalUser,
  revokeClientPortalInvite,
  type ClientPortalInviteFormState,
} from "@/app/(dashboard)/clients/actions";

export interface PortalUserRow {
  id: string;
  email: string | null;
  created_at: string;
}

export interface PortalInviteRow {
  id: string;
  email: string;
  expires_at: string;
  accepted_at: string | null;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Sending…" : "Send invite"}
    </Button>
  );
}

export function ClientPortalAccessPanel({
  clientId,
  users,
  pendingInvites,
}: {
  clientId: string;
  users: PortalUserRow[];
  pendingInvites: PortalInviteRow[];
}) {
  const [state, formAction] = useActionState(inviteClientPortalUser.bind(null, clientId), {
    error: null,
  } as ClientPortalInviteFormState);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Active client portal users</h3>
        {users.length === 0 ? (
          <p className="text-sm text-muted">No one has accepted an invite yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {users.map((user) => (
              <li key={user.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-foreground">{user.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm(`Revoke portal access for ${user.email}?`)) return;
                    startTransition(() => revokeClientPortalUser(clientId, user.id));
                  }}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Pending invites</h3>
        {pendingInvites.length === 0 ? (
          <p className="text-sm text-muted">No pending invites.</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {pendingInvites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <span className="text-foreground">{invite.email}</span>
                  <Badge tone="warning" className="ml-2">
                    Expires {new Date(invite.expires_at).toLocaleDateString()}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => startTransition(() => revokeClientPortalInvite(clientId, invite.id))}
                >
                  Cancel
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form action={formAction} className="flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor="portal_invite_email">Invite by email</Label>
          <Input id="portal_invite_email" name="email" type="email" required placeholder="client@company.com" />
        </div>
        <SubmitButton />
      </form>
      {state.error && (
        <p className={cn("rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
          {state.error}
        </p>
      )}
    </div>
  );
}
