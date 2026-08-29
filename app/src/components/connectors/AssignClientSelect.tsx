"use client";

import { useTransition } from "react";
import { assignDataSourceClient } from "@/app/(dashboard)/data-sources/actions";
import { Select } from "@/components/ui/Input";

type ClientOption = { id: string; name: string };

export function AssignClientSelect({
  dataSourceId,
  clients,
  currentClientId,
}: {
  dataSourceId: string;
  clients: ClientOption[];
  currentClientId: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={currentClientId ?? ""}
      disabled={pending}
      onChange={(e) => {
        const value = e.target.value || null;
        startTransition(() => assignDataSourceClient(dataSourceId, value));
      }}
    >
      <option value="">No client</option>
      {clients.map((client) => (
        <option key={client.id} value={client.id}>
          {client.name}
        </option>
      ))}
    </Select>
  );
}
