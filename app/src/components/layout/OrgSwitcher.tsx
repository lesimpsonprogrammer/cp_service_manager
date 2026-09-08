"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchActiveOrg } from "@/app/(dashboard)/actions";
import type { OrgMembershipOption } from "@/lib/org/getCurrentOrg";

export function OrgSwitcher({
  currentOrgId,
  currentOrgName,
  memberships,
}: {
  currentOrgId: string;
  currentOrgName: string;
  memberships: OrgMembershipOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (memberships.length <= 1) {
    return <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">{currentOrgName}</span>;
  }

  return (
    <select
      value={currentOrgId}
      disabled={pending}
      onChange={(e) => {
        const orgId = e.target.value;
        if (orgId === currentOrgId) return;
        startTransition(async () => {
          const result = await switchActiveOrg(orgId);
          if (!result.error) {
            router.refresh();
          }
        });
      }}
      className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground"
    >
      {memberships.map((m) => (
        <option key={m.orgId} value={m.orgId}>
          {m.orgName}
        </option>
      ))}
    </select>
  );
}
