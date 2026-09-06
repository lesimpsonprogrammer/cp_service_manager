"use client";

import { useTransition } from "react";
import { setOrgPermission } from "@/app/(dashboard)/settings/actions";
import type { OrgPermission } from "@/types/database";

const PERMISSIONS: { key: OrgPermission; label: string; description: string }[] = [
  {
    key: "global_accounting",
    label: "Global Accounting",
    description: "Corporate-level books across every client — the CFO view.",
  },
  {
    key: "global_tenant_manager",
    label: "Global Tenant Manager",
    description: "Can license CPSM to new organizations and approve licensees.",
  },
  {
    key: "business_intelligence",
    label: "Business Intelligence",
    description: "Forecasting, P&L, and cash flow reporting across the org.",
  },
];

export interface MemberOption {
  userId: string;
  fullName: string;
}

export function PermissionsPanel({
  members,
  grants,
}: {
  members: MemberOption[];
  grants: { user_id: string; permission: OrgPermission }[];
}) {
  const [pending, startTransition] = useTransition();

  const hasGrant = (userId: string, permission: OrgPermission) =>
    grants.some((g) => g.user_id === userId && g.permission === permission);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-5 py-2">Member</th>
            {PERMISSIONS.map((p) => (
              <th key={p.key} className="px-3 py-2" title={p.description}>
                {p.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {members.map((member) => (
            <tr key={member.userId}>
              <td className="px-5 py-2 text-foreground">{member.fullName}</td>
              {PERMISSIONS.map((p) => (
                <td key={p.key} className="px-3 py-2">
                  <input
                    type="checkbox"
                    disabled={pending}
                    defaultChecked={hasGrant(member.userId, p.key)}
                    onChange={(e) => {
                      const granted = e.target.checked;
                      startTransition(() => setOrgPermission(member.userId, p.key, granted));
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
