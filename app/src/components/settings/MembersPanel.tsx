"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { orgRoleLabel } from "@/lib/org/roleLabels";
import { removeMember, suspendMember, restoreMember } from "@/app/(dashboard)/settings/actions";

export interface MemberRow {
  user_id: string;
  role: string;
  status: "active" | "suspended" | "removed";
}

export function MembersPanel({
  members,
  currentUserId,
  isAdmin,
}: {
  members: MemberRow[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const active = members.filter((m) => m.status === "active");
  const inactive = members.filter((m) => m.status !== "active");

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-border">
        {active.map((m) => (
          <li key={m.user_id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
            <span className="font-mono text-xs text-muted">{m.user_id}</span>
            <div className="flex items-center gap-2">
              <Badge tone="neutral" className="capitalize">
                {orgRoleLabel(m.role)}
              </Badge>
              {isAdmin && m.user_id !== currentUserId && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => startTransition(() => { void suspendMember(m.user_id); })}
                  >
                    Suspend
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      if (!confirm("Remove this person's access? You can restore them later from the recycle bin."))
                        return;
                      startTransition(() => { void removeMember(m.user_id); });
                    }}
                  >
                    Remove
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      {inactive.length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="px-5 pb-2 text-xs font-medium uppercase tracking-wide text-muted">Recycle bin</p>
          <ul className="divide-y divide-border">
            {inactive.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="font-mono text-xs text-muted">{m.user_id}</span>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral" className="capitalize">
                    {orgRoleLabel(m.role)}
                  </Badge>
                  <Badge tone={m.status === "removed" ? "danger" : "warning"} className="capitalize">
                    {m.status}
                  </Badge>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => startTransition(() => { void restoreMember(m.user_id); })}
                    >
                      Restore
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
