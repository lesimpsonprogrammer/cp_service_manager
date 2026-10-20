import { cn } from "@/lib/utils/cn";
import { formatBytes } from "@/lib/service-desk/attachments";
import { LocalTime } from "./LocalTime";

export interface ThreadAttachment {
  id: string;
  message_id: string | null;
  file_name: string;
  size_bytes: number;
}

export interface ThreadMessage {
  id: string;
  author_type: "staff" | "client" | "system";
  author_name: string | null;
  body: string;
  is_internal: boolean;
  created_at: string;
}

function AttachmentList({ items }: { items: ThreadAttachment[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {items.map((a) => (
        <li key={a.id}>
          <a
            href={`/api/service-desk/attachments/${a.id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground hover:border-brand/50"
          >
            <span aria-hidden="true">📎</span>
            <span className="max-w-[14rem] truncate">{a.file_name}</span>
            <span className="text-muted">{formatBytes(a.size_bytes)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * The conversation, oldest first, opening with the original request.
 * Bodies render as plain text (never HTML) — they're user content.
 * `audience="client"` callers must already have filtered out internal notes
 * (RLS does this for portal users).
 */
export function TicketThread({
  description,
  openedBy,
  openedAt,
  messages,
  attachments,
  audience,
}: {
  description: string;
  openedBy: string;
  openedAt: string;
  messages: ThreadMessage[];
  attachments: ThreadAttachment[];
  audience: "staff" | "client";
}) {
  const byMessage = new Map<string | null, ThreadAttachment[]>();
  for (const a of attachments) {
    const list = byMessage.get(a.message_id) ?? [];
    list.push(a);
    byMessage.set(a.message_id, list);
  }

  return (
    <ol className="space-y-4">
      <li className="rounded-card border border-border bg-surface p-4 shadow-panel">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="font-medium text-foreground">{openedBy}</span>
          <span>opened this request</span>
          <span>·</span>
          <LocalTime iso={openedAt} />
        </div>
        {description ? (
          <p className="whitespace-pre-wrap break-words text-sm text-foreground">{description}</p>
        ) : (
          <p className="text-sm italic text-muted">No description provided.</p>
        )}
        <AttachmentList items={byMessage.get(null) ?? []} />
      </li>

      {messages.map((m) => {
        const mine = audience === "client" ? m.author_type === "client" : m.author_type === "staff";
        return (
          <li
            key={m.id}
            className={cn(
              "rounded-card border p-4",
              m.is_internal
                ? "border-warning/40 bg-warning/5"
                : mine
                  ? "border-brand/30 bg-brand/5"
                  : "border-border bg-surface shadow-panel"
            )}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="font-medium text-foreground">
                {m.author_name ?? (m.author_type === "client" ? "Client" : m.author_type === "system" ? "System" : "Support team")}
              </span>
              {audience === "staff" && (
                <span className="rounded-full border border-border px-1.5 py-px text-[10px] uppercase tracking-wide">
                  {m.is_internal ? "Internal note" : m.author_type === "client" ? "Client" : m.author_type === "system" ? "System" : "Public reply"}
                </span>
              )}
              <span>·</span>
              <LocalTime iso={m.created_at} />
            </div>
            <p className="whitespace-pre-wrap break-words text-sm text-foreground">{m.body}</p>
            <AttachmentList items={byMessage.get(m.id) ?? []} />
          </li>
        );
      })}
    </ol>
  );
}
