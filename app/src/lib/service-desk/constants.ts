import type { TicketChannel, TicketPriority, TicketStatus, TicketType } from "@/types/database";

export const SERVICE_DESK_NAME = "Service Desk";
export const SERVICE_DESK_TAGLINE = "Client requests & internal issues";

export const TICKET_STATUSES: TicketStatus[] = ["new", "open", "pending_client", "on_hold", "resolved", "closed"];
export const TICKET_PRIORITIES: TicketPriority[] = ["urgent", "high", "normal", "low"];
export const TICKET_TYPES: TicketType[] = ["question", "incident", "service_request", "change_request", "problem"];

/** Statuses that still need work from the team. */
export const ACTIVE_STATUSES: TicketStatus[] = ["new", "open", "pending_client", "on_hold"];
/** Statuses that stop the SLA clock (mirrors the trigger in 0039_service_desk_rename.sql). */
export const PAUSED_STATUSES: TicketStatus[] = ["pending_client", "on_hold"];
export const DONE_STATUSES: TicketStatus[] = ["resolved", "closed"];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  new: "New",
  open: "Open",
  pending_client: "Waiting on client",
  on_hold: "On hold",
  resolved: "Resolved",
  closed: "Closed",
};

/** What a client sees — staff wording like "on hold" reads differently to them. */
export const CLIENT_STATUS_LABELS: Record<TicketStatus, string> = {
  new: "Received",
  open: "In progress",
  pending_client: "Awaiting your reply",
  on_hold: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

export const PRIORITY_HINTS: Record<TicketPriority, string> = {
  urgent: "Payroll, filings, or production is blocked right now",
  high: "Major impact, a workaround exists",
  normal: "Standard request or question",
  low: "Minor issue or future request",
};

export const TYPE_LABELS: Record<TicketType, string> = {
  question: "Question",
  incident: "Incident",
  service_request: "Service request",
  change_request: "Change request",
  problem: "Problem",
};

export const CHANNEL_LABELS: Record<TicketChannel, string> = {
  portal: "Client portal",
  staff: "Staff",
  email: "Email",
  api: "API",
};

export type Tone = "neutral" | "success" | "warning" | "danger" | "brand";

export const STATUS_TONES: Record<TicketStatus, Tone> = {
  new: "brand",
  open: "brand",
  pending_client: "warning",
  on_hold: "neutral",
  resolved: "success",
  closed: "neutral",
};

export const PRIORITY_TONES: Record<TicketPriority, Tone> = {
  urgent: "danger",
  high: "warning",
  normal: "neutral",
  low: "neutral",
};

/** Sort weight for "most urgent first". */
export const PRIORITY_RANK: Record<TicketPriority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

/**
 * Built-in SLA targets in minutes, used when a workspace hasn't saved its
 * own. Kept in sync with `service_desk_sla_minutes()` in the migration.
 */
export const DEFAULT_SLA_MINUTES: Record<TicketPriority, { firstResponse: number; resolution: number }> = {
  urgent: { firstResponse: 60, resolution: 240 },
  high: { firstResponse: 240, resolution: 1440 },
  normal: { firstResponse: 480, resolution: 4320 },
  low: { firstResponse: 1440, resolution: 7200 },
};

/** "Due soon" window for the SLA badge and queue filter. */
export const DUE_SOON_MINUTES = 120;

/** Resolved tickets with no further activity are closed by the daily cron after this. */
export const AUTO_CLOSE_AFTER_DAYS = 7;

export const MAX_ATTACHMENTS_PER_MESSAGE = 5;
/** Vercel caps a serverless request body at 4.5 MB, so keep a single upload under that. */
export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;
export const MAX_TOTAL_ATTACHMENT_BYTES = 4 * 1024 * 1024;
export const ATTACHMENTS_BUCKET = "ticket-attachments";

export const ALLOWED_ATTACHMENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const ALLOWED_ATTACHMENT_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "pdf",
  "txt",
  "log",
  "csv",
  "json",
  "zip",
  "xls",
  "xlsx",
  "doc",
  "docx",
];

export const WEBHOOK_EVENTS = {
  created: "ticket.created",
  statusChanged: "ticket.status_changed",
  replied: "ticket.replied",
} as const;
