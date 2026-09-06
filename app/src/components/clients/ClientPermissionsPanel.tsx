"use client";

import { useTransition } from "react";
import { setClientPermission } from "@/app/(dashboard)/clients/actions";
import type { OrgPermission } from "@/types/database";

const PERMISSIONS: { key: OrgPermission; label: string; description: string }[] = [
  {
    key: "client_accounting",
    label: "Client Accounting",
    description: "This client's books — invoices, payments, and financial detail.",
  },
  {
    key: "contract_management",
    label: "Contract Management",
    description: "Can manage this client's contracts. Only grantable to their Project Manager or Consultant.",
  },
];

export interface MemberOption {
  userId: string;
  fullName: string;
}

export function ClientPermissionsPanel({
  clientId,
  members,
  grants,
  trustedUserIds,
}: {
  clientId: string;
  members: MemberOption[];
  grants: { user_id: string; permission: OrgPermission }[];
  trustedUserIds: Set<string>;
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
              {PERMISSIONS.map((p) => {
                const disabled = pending || (p.key === "contract_management" && !trustedUserIds.has(member.userId));
                return (
                  <td key={p.key} className="px-3 py-2">
                    <input
                      type="checkbox"
                      disabled={disabled}
                      defaultChecked={hasGrant(member.userId, p.key)}
                      title={
                        p.key === "contract_management" && !trustedUserIds.has(member.userId)
                          ? "Assign them as this client's Project Manager or Consultant first."
                          : undefined
                      }
                      onChange={(e) => {
                        const granted = e.target.checked;
                        startTransition(() => setClientPermission(clientId, member.userId, p.key, granted));
                      }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
