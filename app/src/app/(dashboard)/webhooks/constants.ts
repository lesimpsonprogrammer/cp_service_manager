export const EVENT_OPTIONS = [
  "pipeline.run.completed",
  "data_source.status_changed",
  "ticket.created",
  "ticket.status_changed",
  "ticket.replied",
  "service_desk.sla_breached",
  "security.api_key.created",
  "security.api_key.revoked",
  "security.member.invited",
  "security.signup.approved",
  "system.job.failed",
  "system.job.succeeded",
  "system.email.failed",
] as const;

/** The events to tick when pointing a webhook at Global Security. */
export const GLOBAL_SECURITY_EVENTS: readonly (typeof EVENT_OPTIONS)[number][] = [
  "pipeline.run.completed",
  "ticket.status_changed",
  "service_desk.sla_breached",
  "security.api_key.created",
  "security.api_key.revoked",
  "security.member.invited",
  "security.signup.approved",
  "system.job.failed",
  "system.job.succeeded",
  "system.email.failed",
];
