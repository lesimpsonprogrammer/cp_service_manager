"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConnectorFieldInput } from "@/components/connectors/ConnectorFieldInput";
import { saveAccountingConnection, disconnectAccountingConnection } from "@/app/(dashboard)/accounting/actions";
import type { AccountingConnectionTypeDefinition } from "@/lib/accounting/registry";
import type { ConnectorField } from "@/lib/connectors/types";
import type { AccountingConnectionStatus } from "@/types/database";

const initialState = { error: null };

function SubmitButton({ hasConnection }: { hasConnection: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : hasConnection ? "Update connection" : "Connect"}
    </Button>
  );
}

export function ConnectionCard({
  definition,
  fields,
  config,
  hasSecret,
  status,
  companyName,
  canManage,
}: {
  definition: AccountingConnectionTypeDefinition;
  fields: ConnectorField[];
  config: Record<string, string>;
  hasSecret: Record<string, boolean>;
  status: AccountingConnectionStatus;
  companyName: string | null;
  canManage: boolean;
}) {
  const action = saveAccountingConnection.bind(null, definition.type);
  const [state, formAction] = useActionState(action, initialState);
  const hasConnection = status !== "not_connected";

  const badgeTone = status === "connected" ? "success" : status === "error" ? "danger" : "neutral";
  const badgeLabel = status === "not_connected" ? "Not connected" : status === "connected" ? "Connected" : "Error";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <span aria-hidden="true">{definition.icon}</span>
            {definition.label}
          </CardTitle>
          <p className="mt-1 text-sm text-muted">{definition.description}</p>
        </div>
        <Badge tone={badgeTone}>{badgeLabel}</Badge>
      </CardHeader>
      <CardContent>
        {hasConnection && companyName && (
          <p className="mb-4 text-sm text-muted">
            QuickBooks company: <span className="text-foreground">{companyName}</span>
          </p>
        )}

        {canManage ? (
          <form action={formAction} className="space-y-4">
            {fields.map((field) => (
              <ConnectorFieldInput
                key={field.key}
                field={field}
                existingValue={config[field.key]}
                hasExistingSecret={hasSecret[field.key]}
              />
            ))}

            {state.error && (
              <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {state.error}
              </p>
            )}

            <div className="flex items-center gap-3">
              <SubmitButton hasConnection={hasConnection} />
              {hasConnection && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => disconnectAccountingConnection(definition.type)}
                >
                  Disconnect
                </Button>
              )}
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted">Only workspace owners/admins can manage this connection.</p>
        )}
      </CardContent>
    </Card>
  );
}
