import { z } from "zod";
import {
  ALLOWED_ATTACHMENT_EXTENSIONS,
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENTS_PER_MESSAGE,
  MAX_ATTACHMENT_BYTES,
  MAX_TOTAL_ATTACHMENT_BYTES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_TYPES,
} from "./constants";
import type { TicketPriority, TicketStatus, TicketType } from "@/types/database";

const uuid = z.string().uuid();
const optionalUuid = z
  .string()
  .trim()
  .transform((v) => v || null)
  .pipe(uuid.nullable());

export const ticketStatusSchema = z.enum(TICKET_STATUSES as [TicketStatus, ...TicketStatus[]]);
export const ticketPrioritySchema = z.enum(TICKET_PRIORITIES as [TicketPriority, ...TicketPriority[]]);
export const ticketTypeSchema = z.enum(TICKET_TYPES as [TicketType, ...TicketType[]]);

/**
 * Normalizes free-text tags: lowercase, dash-separated, deduped, max 10 of
 * 32 chars each. Accepts a comma-separated string or an array.
 */
export function parseTags(input: unknown): string[] {
  const raw = Array.isArray(input) ? input.map(String) : String(input ?? "").split(",");
  const tags = raw
    .map((t) =>
      t
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s_-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 32)
    )
    .filter(Boolean);
  return Array.from(new Set(tags)).slice(0, 10);
}

/**
 * Makes user search text safe to drop into a PostgREST `.or()` filter, whose
 * grammar treats commas, parentheses, and `*`/`%` specially.
 */
export function sanitizeSearch(input: string | null | undefined): string {
  return String(input ?? "")
    .replace(/[,()%*\\:"']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export const staffCreateTicketSchema = z.object({
  subject: z.string().trim().min(3, "Subject must be at least 3 characters.").max(200),
  description: z.string().trim().max(20000).default(""),
  priority: ticketPrioritySchema.default("normal"),
  type: ticketTypeSchema.default("question"),
  status: z.enum(["new", "open", "pending_client", "on_hold"]).default("new"),
  client_id: optionalUuid,
  project_id: optionalUuid,
  category_id: optionalUuid,
  assignee_id: optionalUuid,
  requester_name: z.string().trim().max(120).transform((v) => v || null),
  requester_email: z
    .string()
    .trim()
    .toLowerCase()
    .transform((v) => v || null)
    .pipe(z.string().email("Requester email is not valid.").nullable()),
  tags: z.unknown().transform(parseTags),
  client_visible: z.boolean().default(true),
});

export const clientCreateTicketSchema = z.object({
  subject: z.string().trim().min(3, "Please add a short subject (3+ characters).").max(200),
  description: z.string().trim().min(10, "Please describe the issue (10+ characters).").max(20000),
  priority: ticketPrioritySchema.default("normal"),
  type: ticketTypeSchema.default("question"),
  category_id: optionalUuid,
  project_id: optionalUuid,
});

export const ticketPropertiesSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  status: ticketStatusSchema,
  priority: ticketPrioritySchema,
  type: ticketTypeSchema,
  client_id: optionalUuid,
  project_id: optionalUuid,
  category_id: optionalUuid,
  assignee_id: optionalUuid,
  tags: z.unknown().transform(parseTags),
  client_visible: z.boolean(),
});

export const replySchema = z.object({
  body: z.string().trim().min(1, "Write a message first.").max(20000, "Message is too long (20,000 characters max)."),
});

export const bulkUpdateSchema = z
  .object({
    ticket_ids: z.array(uuid).min(1, "Select at least one ticket.").max(200),
    status: ticketStatusSchema.optional(),
    priority: ticketPrioritySchema.optional(),
    assignee_id: z.union([uuid, z.literal("unassigned")]).optional(),
  })
  .refine((v) => v.status || v.priority || v.assignee_id, { message: "Choose a change to apply." });

export const slaPolicySchema = z
  .object({
    priority: ticketPrioritySchema,
    first_response_minutes: z.coerce.number().int().min(5).max(60 * 24 * 30),
    resolution_minutes: z.coerce.number().int().min(5).max(60 * 24 * 90),
  })
  .refine((v) => v.resolution_minutes >= v.first_response_minutes, {
    message: "Resolution target can't be shorter than the first-response target.",
  });

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).transform((v) => v || null),
  default_assignee_id: optionalUuid,
});

export const macroSchema = z.object({
  name: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(20000),
});

/** First error message from a failed zod parse, for form state. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

export interface AttachmentCandidate {
  name: string;
  size: number;
  type: string;
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

/**
 * Validates files before upload. Browsers send empty File entries for an
 * untouched <input type="file">, so zero-byte nameless entries are dropped.
 */
export function validateAttachments(files: AttachmentCandidate[]): { ok: true; files: AttachmentCandidate[] } | { ok: false; error: string } {
  const real = files.filter((f) => f.name && f.size > 0);
  if (real.length > MAX_ATTACHMENTS_PER_MESSAGE) {
    return { ok: false, error: `Attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files at a time.` };
  }
  let total = 0;
  for (const file of real) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return { ok: false, error: `"${file.name}" is larger than ${MAX_ATTACHMENT_BYTES / 1024 / 1024} MB.` };
    }
    const typeAllowed = ALLOWED_ATTACHMENT_TYPES.includes(file.type);
    const extAllowed = ALLOWED_ATTACHMENT_EXTENSIONS.includes(extensionOf(file.name));
    if (!extAllowed || (file.type && !typeAllowed && file.type !== "application/octet-stream")) {
      return { ok: false, error: `"${file.name}" isn't an allowed file type.` };
    }
    total += file.size;
  }
  if (total > MAX_TOTAL_ATTACHMENT_BYTES) {
    return { ok: false, error: `Attachments total more than ${MAX_TOTAL_ATTACHMENT_BYTES / 1024 / 1024} MB — send them in separate replies.` };
  }
  return { ok: true, files: real };
}

/** Storage-safe file name: keeps the extension, strips path tricks and odd characters. */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "_")
    .replace(/^\.+/, "")
    .slice(-120);
  return cleaned || "file";
}

/** JSON bodies use null/undefined for "not set"; the form schemas expect "". */
function blankNulls(input: unknown, keys: string[]): Record<string, unknown> {
  const body = input && typeof input === "object" ? { ...(input as Record<string, unknown>) } : {};
  for (const key of keys) if (body[key] === null || body[key] === undefined) body[key] = "";
  return body;
}

const API_NULLABLE_KEYS = ["client_id", "project_id", "category_id", "assignee_id", "requester_name", "requester_email", "tags", "description"];

export function parseApiCreateTicket(input: unknown) {
  return staffCreateTicketSchema.safeParse(blankNulls(input, API_NULLABLE_KEYS));
}

export const apiUpdateTicketSchema = z
  .object({
    subject: z.string().trim().min(3).max(200),
    status: ticketStatusSchema,
    priority: ticketPrioritySchema,
    type: ticketTypeSchema,
    assignee_id: uuid.nullable(),
    category_id: uuid.nullable(),
    tags: z.unknown().transform(parseTags),
    client_visible: z.boolean(),
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "Send at least one field to update." });

export const apiMessageSchema = z.object({
  body: z.string().trim().min(1).max(20000),
  is_internal: z.boolean().default(false),
  author_name: z.string().trim().max(120).optional(),
});
