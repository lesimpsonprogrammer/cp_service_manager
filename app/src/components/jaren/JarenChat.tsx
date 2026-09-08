"use client";

import { useCallback, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/Button";
import { renderChatMarkdown } from "@/lib/jaren/markdown";
import { JarenVortexBackground } from "@/components/jaren/JarenVortexBackground";

type ConversationSummary = {
  id: string;
  title: string;
  status: "active" | "archived";
  updated_at: string;
};

type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function JarenChat() {
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<StoredMessage[]>([]);
  const [loadingConversation, setLoadingConversation] = useState(false);
  // Remounts the chat pane (fresh useChat instance) — bumped only when the
  // user explicitly switches or starts a chat, never when a pane in
  // progress self-assigns a conversation id after its first message.
  const [paneKey, setPaneKey] = useState(0);

  const loadConversations = useCallback(async (status: "active" | "archived") => {
    const res = await fetch(`/api/jaren/conversations?status=${status}`);
    if (!res.ok) return;
    const data = (await res.json()) as { conversations: ConversationSummary[] };
    setConversations(data.conversations);
  }, []);

  useEffect(() => {
    // Fetching the conversation list for the active tab, not deriving
    // render state from props/state — the documented exception to this rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations(tab);
  }, [tab, loadConversations]);

  const openConversation = useCallback(async (id: string) => {
    setLoadingConversation(true);
    try {
      const res = await fetch(`/api/jaren/conversations/${id}/messages`);
      const data = res.ok ? ((await res.json()) as { messages: StoredMessage[] }) : { messages: [] };
      setInitialMessages(data.messages);
      setConversationId(id);
      setPaneKey((k) => k + 1);
    } finally {
      setLoadingConversation(false);
    }
  }, []);

  function startNewChat() {
    setConversationId(null);
    setInitialMessages([]);
    setPaneKey((k) => k + 1);
  }

  async function archive(id: string, status: "active" | "archived") {
    await fetch(`/api/jaren/conversations/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (conversationId === id) startNewChat();
    loadConversations(tab);
  }

  return (
    <div className="relative flex h-[70vh] gap-4 overflow-hidden rounded-card">
      <JarenVortexBackground />
      <aside className="relative z-10 flex w-56 shrink-0 flex-col border-r border-border pr-3">
        <Button size="sm" variant="secondary" onClick={startNewChat} className="mb-3">
          + New chat
        </Button>
        <div className="mb-2 flex gap-1 text-xs">
          <button
            onClick={() => setTab("active")}
            className={`rounded-md px-2 py-1 ${tab === "active" ? "bg-surface-2 font-medium text-foreground" : "text-muted"}`}
          >
            Recent
          </button>
          <button
            onClick={() => setTab("archived")}
            className={`rounded-md px-2 py-1 ${tab === "archived" ? "bg-surface-2 font-medium text-foreground" : "text-muted"}`}
          >
            Archived
          </button>
        </div>
        <div className="scrollbar-thin flex-1 space-y-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="px-1 py-2 text-xs text-muted">
              {tab === "active" ? "No conversations yet." : "Nothing archived."}
            </p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-1 rounded-md px-2 py-1.5 text-xs ${
                conversationId === c.id ? "bg-surface-2" : "hover:bg-surface-2"
              }`}
            >
              <button onClick={() => openConversation(c.id)} className="min-w-0 flex-1 text-left">
                <div className="truncate text-foreground">{c.title}</div>
                <div className="text-muted">{relativeTime(c.updated_at)}</div>
              </button>
              <button
                onClick={() => archive(c.id, tab === "active" ? "archived" : "active")}
                title={tab === "active" ? "Archive" : "Restore"}
                className="shrink-0 text-muted opacity-0 hover:text-foreground group-hover:opacity-100"
              >
                {tab === "active" ? "Archive" : "Restore"}
              </button>
            </div>
          ))}
        </div>
      </aside>
      <div className="relative z-10 min-w-0 flex-1">
        {loadingConversation ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">Loading…</div>
        ) : (
          <JarenConversationPane
            key={paneKey}
            conversationId={conversationId}
            initialMessages={initialMessages}
            onConversationCreated={(id) => {
              // Update the highlighted id and refresh the list, but don't
              // bump paneKey — this pane is mid-send and must not remount.
              setConversationId(id);
              loadConversations("active");
              setTab("active");
            }}
            onMessageSaved={() => loadConversations(tab === "archived" ? "active" : tab)}
          />
        )}
      </div>
    </div>
  );
}

function JarenConversationPane({
  conversationId,
  initialMessages,
  onConversationCreated,
  onMessageSaved,
}: {
  conversationId: string | null;
  initialMessages: StoredMessage[];
  onConversationCreated: (id: string) => void;
  onMessageSaved: () => void;
}) {
  const [input, setInput] = useState("");
  const [activeId, setActiveId] = useState(conversationId);
  const [creatingConversation, setCreatingConversation] = useState(false);

  const { messages, sendMessage, status, error } = useChat({
    id: conversationId ?? undefined,
    messages: initialMessages.map((m) => ({
      id: m.id,
      role: m.role,
      parts: [{ type: "text" as const, text: m.content }],
    })),
    transport: new DefaultChatTransport({ api: "/api/jaren/chat" }),
    onFinish: async ({ message }) => {
      const id = activeId;
      if (!id) return;
      const text = message.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("");
      if (!text) return;
      await fetch(`/api/jaren/conversations/${id}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: "assistant", content: text }),
      });
      onMessageSaved();
    },
  });

  const busy = status === "streaming" || status === "submitted" || creatingConversation;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");

    let id = activeId;
    if (!id) {
      setCreatingConversation(true);
      try {
        const res = await fetch("/api/jaren/conversations", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: text.slice(0, 60) }),
        });
        if (res.ok) {
          const data = (await res.json()) as { conversation: ConversationSummary };
          id = data.conversation.id;
          setActiveId(id);
          onConversationCreated(id);
        }
      } finally {
        setCreatingConversation(false);
      }
    }

    if (id) {
      fetch(`/api/jaren/conversations/${id}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: "user", content: text }),
      });
    }

    sendMessage({ text });
    // Signal the vortex background to pull its scattered particles back into
    // formation — the "Jaren enters" moment described alongside the design.
    window.dispatchEvent(new Event("jaren-enters"));
  }

  return (
    <div className="flex h-full flex-col">
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
            {message.parts.map((part, i) => {
              if (part.type !== "text") return null;
              if (message.role === "user") return <span key={i}>{part.text}</span>;
              return (
                <div
                  key={i}
                  className="doc-content doc-content-chat"
                  dangerouslySetInnerHTML={{ __html: renderChatMarkdown(part.text) }}
                />
              );
            })}
          </div>
        ))}
        {(status === "submitted" || creatingConversation) && (
          <div className="mr-auto flex max-w-[80%] items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 text-sm text-muted">
            <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
              <span className="absolute inset-0 animate-pulse rounded-full bg-brand/40 blur-md" />
              <span className="relative h-5 w-5 animate-spin rounded-full border-[3px] border-border-strong border-t-brand shadow-glow" />
            </span>
            <span className="animate-pulse">Jaren is thinking…</span>
          </div>
        )}
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
