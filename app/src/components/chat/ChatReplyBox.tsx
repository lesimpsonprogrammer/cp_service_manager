"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";
import { postTicketReply } from "@/app/(dashboard)/tickets/actions";
import { setChatStatus } from "@/app/(dashboard)/chat/actions";
import type { TicketStatus } from "@/types/database";

interface Macro {
  id: string;
  name: string;
  body: string;
}

function applyMacro(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => vars[key] ?? match);
}

/**
 * Chat-style reply box for the Live Chat inbox: Enter sends, Shift+Enter is
 * a new line. Posts through the Service Desk's own reply action, so a chat
 * reply is a normal public ticket reply (the visitor sees it in the widget,
 * or by email if they've left).
 */
export function ChatReplyBox({
  ticketId,
  status,
  macros,
  macroVars,
}: {
  ticketId: string;
  status: TicketStatus;
  macros: Macro[];
  macroVars: Record<string, string>;
}) {
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const send = () => {
    const text = body.trim();
    if (!text || pending) return;
    const formData = new FormData();
    formData.set("body", text);
    formData.set("visibility", internal ? "internal" : "public");
    startTransition(async () => {
      const result = await postTicketReply(ticketId, { error: null }, formData);
      if (result.error) setError(result.error);
      else {
        setError(null);
        setBody("");
      }
    });
  };

  const changeStatus = (next: "open" | "resolved" | "closed") => {
    startTransition(async () => {
      const result = await setChatStatus(ticketId, next);
      setError(result.error);
    });
  };

  const done = status === "resolved" || status === "closed";

  return (
    <div
      className={cn(
        "rounded-card border p-3 shadow-panel",
        internal ? "border-warning/40 bg-warning/5" : "border-border bg-surface"
      )}
    >
      <Textarea
        aria-label={internal ? "Internal note" : "Reply to the visitor"}
        rows={3}
        value={body}
        maxLength={4000}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
        placeholder={
          internal
            ? "Only your team sees internal notes…"
            : status === "closed"
              ? "This chat is closed. Reopen it to reply."
              : "Type a reply and press Enter. The visitor sees it right away, or by email if they've left."
        }
        disabled={!internal && status === "closed"}
      />
      {error && (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
          Internal note
        </label>
        {macros.length > 0 && (
          <Select
            aria-label="Insert a macro"
            defaultValue=""
            className="h-8 w-44 text-xs"
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
        )}
        <div className="ml-auto flex items-center gap-2">
          {done ? (
            <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => changeStatus("open")}>
              Reopen
            </Button>
          ) : (
            <>
              <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => changeStatus("resolved")}>
                Resolve
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => changeStatus("closed")}>
                Close chat
              </Button>
            </>
          )}
          <Button type="button" size="sm" disabled={pending || !body.trim() || (!internal && status === "closed")} onClick={send}>
            {pending ? "Sending…" : internal ? "Add note" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
