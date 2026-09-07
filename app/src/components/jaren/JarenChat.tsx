"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/Button";

export function JarenChat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/jaren/chat" }),
  });

  const busy = status === "streaming" || status === "submitted";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <div className="flex h-[70vh] flex-col">
      <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-1 py-2">
        {messages.length === 0 && (
          <p className="text-sm text-muted">
            Ask Jaren about data modeling, field mapping, automation design, or SQL.
            Jaren proposes plans here — nothing is changed in CPSM until you approve it.
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "ml-auto max-w-[80%] rounded-card bg-brand px-4 py-2 text-sm text-brand-foreground"
                : "mr-auto max-w-[80%] rounded-card border border-border bg-surface px-4 py-2 text-sm text-foreground"
            }
          >
            {message.parts.map((part, i) =>
              part.type === "text" ? <span key={i}>{part.text}</span> : null
            )}
          </div>
        ))}
        {error && (
          <p className="rounded-card border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error.message || "Jaren hit an error. Try again in a moment."}
          </p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2 border-t border-border pt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message Jaren..."
          disabled={busy}
          className="flex-1 rounded-card border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
        />
        <Button type="submit" disabled={busy || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
