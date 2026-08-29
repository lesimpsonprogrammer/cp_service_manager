"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { CONNECTOR_DEFINITIONS } from "@/lib/connectors/registry";
import { createDataSource, type DataSourceFormState } from "@/app/(dashboard)/data-sources/actions";
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
      {pending ? "Creating…" : "Create data source"}
    </Button>
  );
}

export function NewDataSourceForm({ clients = [] }: { clients?: ClientOption[] }) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [state, formAction] = useActionState(createDataSource, initialState);

  const definition = CONNECTOR_DEFINITIONS.find((c) => c.type === selectedType);

  if (!definition) {
    const categories = Array.from(new Set(CONNECTOR_DEFINITIONS.map((c) => c.category)));
    return (
      <div className="space-y-8">
        {categories.map((category) => (
          <div key={category}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{category}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CONNECTOR_DEFINITIONS.filter((c) => c.category === category).map((connector) => (
                <button
                  key={connector.type}
                  type="button"
                  onClick={() => setSelectedType(connector.type)}
                  className="group text-left"
                >
                  <Card className="h-full p-4 transition-colors group-hover:border-brand/50">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-2 text-lg">
                      {connector.icon}
                    </span>
                    <p className="mt-3 text-sm font-medium text-foreground">{connector.label}</p>
                    <p className="mt-1 text-xs text-muted">{connector.description}</p>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className="max-w-xl p-6">
      <button
        type="button"
        onClick={() => setSelectedType(null)}
        className="mb-4 text-xs text-muted hover:text-foreground"
      >
        ← Choose a different connector
      </button>

      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-2 text-lg">
          {definition.icon}
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{definition.label}</p>
          <p className="text-xs text-muted">{definition.description}</p>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="type" value={definition.type} />
        <div>
          <Label htmlFor="name">Data source name</Label>
          <Input id="name" name="name" required placeholder={`My ${definition.label}`} />
        </div>

        {definition.fields.map((field) => (
          <ConnectorFieldInput key={field.key} field={field} />
        ))}

        {clients.length > 0 && (
          <div>
            <Label htmlFor="client_id">Client (optional)</Label>
            <Select id="client_id" name="client_id" defaultValue="">
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
          <p className={cn("rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>
    </Card>
  );
}
