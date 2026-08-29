"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { createInvite, revokeInvite, type SettingsFormState } from "@/app/(dashboard)/settings/actions";
import type { OrgRole } from "@/types/database";

export interface InviteRow {
  id: string;
  email: string;
  role: OrgRole;
  token: string;
  expires_at: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Sending invite…" : "Create invite"}
    </Button>
  );
}

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied!" : "Copy link"}
    </Button>
  );
}

export function InvitesPanel({ invites, appUrl }: { invites: InviteRow[]; appUrl: string }) {
  const [state, formAction] = useActionState(createInvite, { error: null } as SettingsFormState);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {invites.length > 0 ? (
        <ul className="divide-y divide-border">
          {invites.map((invite) => (
            <li key={invite.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
              <div>
                <span className="font-medium text-foreground">{invite.email}</span>
                <span className="ml-2 text-xs capitalize text-muted">{invite.role}</span>
                <p className="text-xs text-muted">Expires {new Date(invite.expires_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <CopyLinkButton url={`${appUrl}/signup?invite=${invite.token}`} />
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => startTransition(() => revokeInvite(invite.id))}
                >
                  Revoke
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-2 text-sm text-muted">No pending invites.</p>
      )}

      <form action={formAction} className="grid gap-3 px-5 pb-4 sm:grid-cols-[1fr_140px_auto] sm:items-end">
        <div>
          <Label htmlFor="invite_email">Email</Label>
          <Input id="invite_email" name="email" type="email" required placeholder="teammate@company.com" />
        </div>
        <div>
          <Label htmlFor="invite_role">Role</Label>
          <Select id="invite_role" name="role" defaultValue="member">
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </Select>
        </div>
        <SubmitButton />
        {state.error && (
          <p className={cn("sm:col-span-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
}
