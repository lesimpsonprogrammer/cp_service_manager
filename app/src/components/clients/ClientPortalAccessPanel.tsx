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
  updateClientPortalUserRole,
  type ClientPortalInviteFormState,
} from "@/app/(dashboard)/clients/actions";
import { CLIENT_PORTAL_ROLE_LABELS, type ClientPortalRole } from "@/lib/portal/permissions";

const ROLE_OPTIONS: ClientPortalRole[] = ["client_user", "client_administrator", "client_tpa"];

export interface PortalUserRow {
  id: string;
  email: string | null;
  created_at: string;
  role: ClientPortalRole;
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
              <li key={user.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="text-foreground">{user.email}</span>
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground"
                    value={user.role}
                    disabled={pending}
                    onChange={(e) =>
                      startTransition(() =>
                        updateClientPortalUserRole(clientId, user.id, e.target.value as ClientPortalRole)
                      )
                    }
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {CLIENT_PORTAL_ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
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
                </div>
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
        <div>
          <Label htmlFor="portal_invite_role">Role</Label>
          <select
            id="portal_invite_role"
            name="role"
            defaultValue="client_user"
            className="h-9 rounded-md border border-border bg-surface px-2 text-sm text-foreground"
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {CLIENT_PORTAL_ROLE_LABELS[role]}
              </option>
            ))}
          </select>
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
