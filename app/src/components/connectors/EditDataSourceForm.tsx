"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateDataSource, type DataSourceFormState } from "@/app/(dashboard)/data-sources/actions";
import type { ConnectorDefinition } from "@/lib/connectors/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { ConnectorFieldInput } from "./ConnectorFieldInput";

const initialState: DataSourceFormState = { error: null };

type ClientOption = { id: string; name: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

export function EditDataSourceForm({
  dataSourceId,
  definition,
  name,
  config,
  hasSecret,
  clients,
  currentClientId,
}: {
  dataSourceId: string;
  definition: ConnectorDefinition;
  name: string;
  /** Non-secret config values only — secrets are never sent to the client. */
  config: Record<string, string>;
  hasSecret: Record<string, boolean>;
  clients: ClientOption[];
  currentClientId: string | null;
}) {
  const updateWithId = updateDataSource.bind(null, dataSourceId);
  const [state, formAction] = useActionState(updateWithId, initialState);

  return (
    <Card className="max-w-xl p-6">
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="name">Data source name</Label>
          <Input id="name" name="name" required defaultValue={name} />
        </div>

        {definition.fields.map((field) => (
          <ConnectorFieldInput
            key={field.key}
            field={field}
            existingValue={config[field.key]}
            hasExistingSecret={hasSecret[field.key]}
          />
        ))}

        {clients.length > 0 && (
          <div>
            <Label htmlFor="client_id">Client (optional)</Label>
            <Select id="client_id" name="client_id" defaultValue={currentClientId ?? ""}>
              <option value="">No client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {state.error && (
          <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
        )}

        <SubmitButton />
      </form>
    </Card>
  );
}
