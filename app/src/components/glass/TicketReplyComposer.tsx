"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Label, Select, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";
import { postTicketReply, type GlassFormState } from "@/app/(dashboard)/tickets/actions";
import { MAX_ATTACHMENTS_PER_MESSAGE, STATUS_LABELS, TICKET_STATUSES } from "@/lib/glass/constants";
import type { TicketStatus } from "@/types/database";

export interface MacroOption {
  id: string;
  name: string;
  body: string;
}

/** Fills {{placeholders}} in a macro; unknown ones are left as-is so they're easy to spot. */
function applyMacro(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => vars[key] ?? match);
}

export function TicketReplyComposer({
  ticketId,
  currentStatus,
  macros,
  macroVars,
  canReplyPublicly,
}: {
  ticketId: string;
  currentStatus: TicketStatus;
  macros: MacroOption[];
  macroVars: Record<string, string>;
  /** False when there's no one outside the team to send a public reply to. */
  canReplyPublicly: boolean;
}) {
  const [visibility, setVisibility] = useState<"public" | "internal">(canReplyPublicly ? "public" : "internal");
  const [body, setBody] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [state, formAction, pending] = useActionState(async (prev: GlassFormState, formData: FormData) => {
    const result = await postTicketReply(ticketId, prev, formData);
    if (!result.error) {
      setBody("");
      setFormKey((k) => k + 1);
    }
    return result;
  }, { error: null } as GlassFormState);

  const internal = visibility === "internal";

  return (
    <form
      key={formKey}
      action={formAction}
      className={cn(
        "rounded-card border p-4 shadow-panel",
        internal ? "border-warning/40 bg-warning/5" : "border-border bg-surface"
      )}
    >
      <input type="hidden" name="visibility" value={visibility} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-border p-0.5 text-xs" role="radiogroup" aria-label="Reply type">
          {(["public", "internal"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={visibility === v}
              disabled={v === "public" && !canReplyPublicly}
              onClick={() => setVisibility(v)}
              className={cn(
                "rounded px-2.5 py-1 font-medium disabled:cursor-not-allowed disabled:opacity-40",
                visibility === v ? "bg-surface-2 text-foreground" : "text-muted hover:text-foreground"
              )}
            >
              {v === "public" ? "Reply to requester" : "Internal note"}
            </button>
          ))}
        </div>
        {macros.length > 0 && (
          <div className="ml-auto w-48">
            <Select
              aria-label="Insert a macro"
              defaultValue=""
              className="h-8 text-xs"
              onChange={(e) => {
                const macro = macros.find((m) => m.id === e.target.value);
                if (macro) setBody((prev) => (prev ? `${prev}\n\n` : "") + applyMacro(macro.body, macroVars));
                e.target.value = "";
              }}
            >
              <option value="">Insert macro…</option>
              {macros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <Label htmlFor="reply-body" className="sr-only">
        Message
      </Label>
      <Textarea
        id="reply-body"
        name="body"
        rows={6}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={internal ? "Only your team sees internal notes…" : "Write your reply — the requester gets it by email and in the portal."}
        maxLength={20000}
      />

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="reply-attachments" className="mb-1 block text-xs text-muted">
            Attach (max {MAX_ATTACHMENTS_PER_MESSAGE})
          </label>
          <input
            id="reply-attachments"
            name="attachments"
            type="file"
            multiple
            className="block text-xs text-muted file:mr-2 file:rounded-md file:border file:border-border file:bg-surface-2 file:px-2 file:py-1 file:text-xs file:text-foreground"
          />
        </div>
        <div className="ml-auto flex items-end gap-2">
          <div>
            <label htmlFor="next_status" className="mb-1 block text-xs text-muted">
              Then set status
            </label>
            <Select id="next_status" name="next_status" defaultValue="" className="h-9 text-sm">
              <option value="">Keep ({STATUS_LABELS[currentStatus]})</option>
              {TICKET_STATUSES.filter((s) => s !== currentStatus && s !== "new").map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" disabled={pending || !body.trim()} variant={internal ? "secondary" : "primary"}>
            {pending ? "Sending…" : internal ? "Add note" : "Send reply"}
          </Button>
        </div>
      </div>

      {(state.error || state.success) && (
        <p className={cn("mt-3 text-sm", state.error ? "text-danger" : "text-success")} role="status">
          {state.error ?? state.success}
        </p>
      )}
    </form>
  );
}
