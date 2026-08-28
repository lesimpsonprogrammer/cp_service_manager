"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createWebhook, EVENT_OPTIONS, type WebhookFormState } from "@/app/(dashboard)/webhooks/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";

const initialState: WebhookFormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating…" : "Create webhook"}
    </Button>
  );
}

export function NewWebhookForm({ dataSources }: { dataSources: { id: string; name: string }[] }) {
  const [direction, setDirection] = useState<"inbound" | "outbound">("outbound");
  const [state, formAction] = useActionState(createWebhook, initialState);

  return (
    <Card className="max-w-xl p-6">
      <div className="mb-5 flex gap-2 rounded-md bg-surface-2 p-1">
        {(["outbound", "inbound"] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDirection(d)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium capitalize transition-colors ${
              direction === d ? "bg-surface text-foreground shadow-sm" : "text-muted"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="direction" value={direction} />
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required placeholder={direction === "outbound" ? "Slack notifications" : "Vendor push feed"} />
        </div>

        {direction === "outbound" ? (
          <>
            <div>
              <Label htmlFor="target_url">Target URL</Label>
              <Input id="target_url" name="target_url" type="url" required placeholder="https://your-app.com/hooks/cpsm" />
            </div>
            <div>
              <Label>Events</Label>
              <div className="space-y-2">
                {EVENT_OPTIONS.map((event) => (
                  <label key={event} className="flex items-center gap-2 text-sm text-foreground">
                    <input type="checkbox" name={`event_${event}`} className="rounded border-border" />
                    <span className="font-mono text-xs">{event}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div>
            <Label htmlFor="data_source_id">Feeds data source</Label>
            <Select id="data_source_id" name="data_source_id" required defaultValue="">
              <option value="" disabled>
                Select a data source…
              </option>
              {dataSources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
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
