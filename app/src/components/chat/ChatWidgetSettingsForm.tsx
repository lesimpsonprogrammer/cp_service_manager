"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";
import { saveChatWidgetSettings, type ChatFormState } from "@/app/(dashboard)/chat/actions";

export interface ChatWidgetSettingsValue {
  is_enabled: boolean;
  title: string;
  greeting: string;
  accent_color: string;
  default_assignee_id: string | null;
  allowed_origins: string[];
  site_url: string | null;
}

export function ChatWidgetSettingsForm({
  value,
  members,
  editable,
}: {
  value: ChatWidgetSettingsValue;
  members: { userId: string; fullName: string }[];
  editable: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveChatWidgetSettings, { error: null } as ChatFormState);
  const [color, setColor] = useState(value.accent_color);

  return (
    <form action={formAction} className="space-y-4">
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="is_enabled" defaultChecked={value.is_enabled} disabled={!editable} />
        Show the chat bubble on the website
      </label>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <div>
          <Label htmlFor="chat-title">Title</Label>
          <Input id="chat-title" name="title" defaultValue={value.title} maxLength={60} required disabled={!editable} />
        </div>
        <div>
          <Label htmlFor="chat-color">Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Pick a color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={!editable}
              className="h-9 w-10 cursor-pointer rounded border border-border bg-transparent"
            />
            <Input
              id="chat-color"
              name="accent_color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              pattern="#[0-9A-Fa-f]{6}"
              disabled={!editable}
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="chat-greeting">Greeting</Label>
        <Textarea id="chat-greeting" name="greeting" rows={3} defaultValue={value.greeting} maxLength={500} required disabled={!editable} />
      </div>

      <div>
        <Label htmlFor="chat-assignee">New chats go to</Label>
        <Select id="chat-assignee" name="default_assignee_id" defaultValue={value.default_assignee_id ?? ""} disabled={!editable}>
          <option value="">Workspace owner</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.fullName}
            </option>
          ))}
        </Select>
        <p className="mt-1 text-xs text-muted">They&apos;re emailed when a chat starts, and again when the visitor writes after a quiet spell.</p>
      </div>

      <div>
        <Label htmlFor="chat-site">Website address</Label>
        <Input id="chat-site" name="site_url" type="url" placeholder="https://www.example.com" defaultValue={value.site_url ?? ""} disabled={!editable} />
        <p className="mt-1 text-xs text-muted">Reply emails link visitors back here, with the chat open.</p>
      </div>

      <div>
        <Label htmlFor="chat-origins">Sites allowed to show the bubble</Label>
        <Textarea
          id="chat-origins"
          name="allowed_origins"
          rows={3}
          defaultValue={value.allowed_origins.join("\n")}
          placeholder={"https://example.com\nhttps://www.example.com"}
          disabled={!editable}
        />
        <p className="mt-1 text-xs text-muted">One per line. Leave empty to allow any site (not recommended).</p>
      </div>

      {editable && (
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
          {(state.error || state.success) && (
            <p className={cn("text-sm", state.error ? "text-danger" : "text-success")} role="status">
              {state.error ?? state.success}
            </p>
          )}
        </div>
      )}
    </form>
  );
}
