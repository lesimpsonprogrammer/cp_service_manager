"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import { SqlEditorConsole } from "@/components/sql-editor/SqlEditorConsole";
import type { QueryLogEntry, ScopableClient } from "@/app/(dashboard)/sql-editor/actions";

export function SqlEditorWorkspace({
  orgName,
  environment,
  lockOrgScope,
  clients,
  recentQueries,
}: {
  orgName: string;
  environment: string;
  lockOrgScope: boolean;
  clients: ScopableClient[];
  recentQueries: QueryLogEntry[];
}) {
  const [clientId, setClientId] = useState<string | null>(null);
  const selectedClient = clients.find((c) => c.id === clientId) ?? null;

  return (
    <>
      <PageHeader
        title="SQL Editor"
        description="Read-only. Run SELECT queries against your organization's own data — every table you can see here is the same data RLS already scopes to you."
        action={
          <div className="flex items-center gap-2">
            <Badge tone="neutral" className="capitalize">
              env: {environment}
            </Badge>
            <select
              value={clientId ?? ""}
              disabled={lockOrgScope}
              onChange={(e) => setClientId(e.target.value || null)}
              title={
                lockOrgScope
                  ? "Client scoping is locked to org-wide in Settings."
                  : "Scope queries to a single client"
              }
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium outline-none",
                lockOrgScope
                  ? "cursor-not-allowed border-border bg-surface-2 text-muted opacity-70"
                  : "cursor-pointer border-brand/30 bg-brand/10 text-brand"
              )}
            >
              <option value="">{orgName}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {lockOrgScope && (
              <Badge tone="neutral" title="An owner or admin can unlock this in Settings.">
                🔒 locked
              </Badge>
            )}
          </div>
        }
      />

      <SqlEditorConsole recentQueries={recentQueries} clientId={clientId} clientName={selectedClient?.name ?? null} />
    </>
  );
}
