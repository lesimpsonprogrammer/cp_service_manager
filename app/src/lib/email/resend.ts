import { Resend } from "resend";
import { reportEmailFailure } from "@/lib/webhooks/emit";
import type { SystemReportSection } from "@/lib/reports/systemReport";

const FROM = process.env.RESEND_FROM_EMAIL ?? "notifications@cpservicemanager.com";
// Display name only — actually sending from jaren.agent@momentumdatasolutions.com
// requires that domain to be verified as a Resend sending domain first; until
// then this still sends from FROM above, just labeled as Jaren.
const JAREN_FROM = `Jaren CP <${FROM}>`;

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function sendContractSigningEmail({
  to,
  signerName,
  clientName,
  contractName,
  signingUrl,
}: {
  to: string;
  signerName: string;
  clientName: string;
  contractName: string;
  signingUrl: string;
}): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping contract signing email.");
    return false;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `${contractName} — signature requested`,
    html: `
      <p>Hi ${signerName},</p>
      <p>${clientName} has a contract ready for your signature: <strong>${contractName}</strong>.</p>
      <p><a href="${signingUrl}">Review and sign the contract</a></p>
      <p>This link is unique to you — please don't forward it.</p>
    `,
  });
  if (error) {
    console.error("Resend error sending contract signing email:", error);
    reportEmailFailure("contract signing", error);
    return false;
  }
  return true;
}

export async function sendContractReminderEmail({
  to,
  signerName,
  clientName,
  contractName,
  signingUrl,
}: {
  to: string;
  signerName: string;
  clientName: string;
  contractName: string;
  signingUrl: string;
}): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping contract reminder email.");
    return false;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Reminder: ${contractName} is awaiting your signature`,
    html: `
      <p>Hi ${signerName},</p>
      <p>This is a reminder that ${clientName} is still waiting on your signature for <strong>${contractName}</strong>.</p>
      <p><a href="${signingUrl}">Review and sign the contract</a></p>
    `,
  });
  if (error) {
    console.error("Resend error sending contract reminder email:", error);
    reportEmailFailure("contract reminder", error);
    return false;
  }
  return true;
}

export async function sendTimecardApprovalEmail({
  to,
  approverName,
  clientName,
  periodStart,
  periodEnd,
  totalHours,
  reviewUrl,
}: {
  to: string;
  approverName: string;
  clientName: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  reviewUrl: string;
}): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping timecard approval email.");
    return false;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Timecard for review: ${periodStart} – ${periodEnd}`,
    html: `
      <p>Hi ${approverName},</p>
      <p>${clientName}'s timecard for ${periodStart} – ${periodEnd} (${totalHours} hours) is ready for your review.</p>
      <p><a href="${reviewUrl}">Review and approve the timecard</a></p>
    `,
  });
  if (error) {
    console.error("Resend error sending timecard approval email:", error);
    reportEmailFailure("timecard approval", error);
    return false;
  }
  return true;
}

export async function sendTimecardDecisionNotification({
  to,
  clientName,
  periodStart,
  periodEnd,
  approved,
  decidedByName,
  reason,
}: {
  to: string;
  clientName: string;
  periodStart: string;
  periodEnd: string;
  approved: boolean;
  decidedByName: string;
  reason?: string | null;
}): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping timecard decision email.");
    return false;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Timecard ${approved ? "approved" : "rejected"}: ${periodStart} – ${periodEnd}`,
    html: approved
      ? `<p>${decidedByName} approved ${clientName}'s timecard for ${periodStart} – ${periodEnd}.</p>`
      : `<p>${decidedByName} rejected ${clientName}'s timecard for ${periodStart} – ${periodEnd}.${reason ? ` Reason: ${reason}` : ""}</p>`,
  });
  if (error) {
    console.error("Resend error sending timecard decision email:", error);
    reportEmailFailure("timecard decision", error);
    return false;
  }
  return true;
}

export async function sendClientPortalInviteEmail({
  to,
  clientName,
  invitedByName,
  acceptUrl,
}: {
  to: string;
  clientName: string;
  invitedByName: string;
  acceptUrl: string;
}): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping client portal invite email.");
    return false;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `You're invited to ${clientName}'s client portal`,
    html: `
      <p>Hi,</p>
      <p>${invitedByName} invited you to ${clientName}'s client portal — a live view of your projects, data syncs, contracts, and invoices.</p>
      <p><a href="${acceptUrl}">Set your password and sign in</a></p>
      <p>This link is unique to you — please don't forward it.</p>
    `,
  });
  if (error) {
    console.error("Resend error sending client portal invite email:", error);
    reportEmailFailure("client portal invite", error);
    return false;
  }
  return true;
}

export async function sendProjectStageChangeEmail({
  to,
  clientName,
  projectName,
  projectCode,
  stageLabel,
  portalUrl,
}: {
  to: string;
  clientName: string;
  projectName: string;
  projectCode: string;
  stageLabel: string;
  portalUrl: string;
}): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping project stage change email.");
    return false;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `${projectName} moved to "${stageLabel}"`,
    html: `
      <p>Hi,</p>
      <p>${clientName}'s project <strong>${projectName}</strong> (${projectCode}) just moved to <strong>${stageLabel}</strong>.</p>
      <p><a href="${portalUrl}">View it in your client portal</a></p>
    `,
  });
  if (error) {
    console.error("Resend error sending project stage change email:", error);
    reportEmailFailure("project stage change", error);
    return false;
  }
  return true;
}

export async function sendPipelineRunClientEmail({
  to,
  clientName,
  dataSourceName,
  runNumber,
  status,
  recordsLoaded,
  error,
  portalUrl,
}: {
  to: string;
  clientName: string;
  dataSourceName: string;
  runNumber: string;
  status: string;
  recordsLoaded: number;
  error: string | null;
  portalUrl: string;
}): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping pipeline run client email.");
    return false;
  }

  const succeeded = status === "succeeded";

  const { error: sendError } = await resend.emails.send({
    from: FROM,
    to,
    subject: `${succeeded ? "Sync complete" : "Sync issue"}: ${dataSourceName} (${runNumber})`,
    html: `
      <p>Hi,</p>
      <p>A data sync for ${clientName}'s <strong>${dataSourceName}</strong> connection just ${succeeded ? "finished" : `ended with status "${status}"`} (${runNumber}), loading ${recordsLoaded} record${recordsLoaded === 1 ? "" : "s"}.</p>
      ${error ? `<p>Error: ${error}</p>` : ""}
      <p><a href="${portalUrl}">View sync history in your client portal</a></p>
    `,
  });
  if (sendError) {
    console.error("Resend error sending pipeline run client email:", sendError);
    reportEmailFailure("pipeline run client", sendError);
    return false;
  }
  return true;
}

export async function sendContractSignedNotification({
  to,
  clientName,
  contractName,
  signedByName,
}: {
  to: string;
  clientName: string;
  contractName: string;
  signedByName: string;
}): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping signed notification email.");
    return false;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Signed: ${contractName}`,
    html: `<p>${signedByName} just signed <strong>${contractName}</strong> for ${clientName}.</p>`,
  });
  if (error) {
    console.error("Resend error sending signed notification email:", error);
    reportEmailFailure("signed notification", error);
    return false;
  }
  return true;
}

export async function sendInvoiceEmail({
  to,
  contactName,
  clientName,
  invoiceNumber,
  total,
  dueDate,
  invoiceUrl,
}: {
  to: string;
  contactName: string;
  clientName: string;
  invoiceNumber: string;
  total: number;
  dueDate: string | null;
  invoiceUrl: string;
}): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping invoice email.");
    return false;
  }

  const amount = `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Invoice ${invoiceNumber} from ${clientName}'s service provider — ${amount} due`,
    html: `
      <p>Hi ${contactName},</p>
      <p>A new invoice is ready for ${clientName}: <strong>${invoiceNumber}</strong>, ${amount}${
        dueDate ? ` due ${dueDate}` : ""
      }.</p>
      <p><a href="${invoiceUrl}">View and download the invoice (PDF)</a></p>
    `,
  });
  if (error) {
    console.error("Resend error sending invoice email:", error);
    reportEmailFailure("invoice", error);
    return false;
  }
  return true;
}

function money(amount: number) {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function sendSystemReportEmail({
  to,
  orgName,
  report,
}: {
  to: string[];
  orgName: string;
  report: SystemReportSection;
}): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping system report email.");
    return false;
  }

  const section = (title: string, rows: string[]) =>
    rows.length === 0
      ? ""
      : `<h3 style="margin:20px 0 8px;">${title}</h3><ul style="margin:0;padding-left:20px;">${rows
          .map((r) => `<li>${r}</li>`)
          .join("")}</ul>`;

  const html = `
    <p>Hi there,</p>
    <p>Here's your system digest for <strong>${orgName}</strong> — new activity from the last 7 days, plus what needs attention.</p>
    ${section(
      "New clients",
      report.newClients.map((c) => `${c.name} — added ${new Date(c.createdAt).toLocaleDateString()}`)
    )}
    ${section(
      "New logins",
      report.newLogins.map((l) => `${l.email} — ${new Date(l.lastSignInAt).toLocaleString()}`)
    )}
    ${section(
      "Unpaid invoices",
      report.unpaidInvoices.map(
        (i) =>
          `${i.invoiceNumber} — ${i.clientName} — ${money(i.total)}${
            i.dueDate ? ` (due ${i.dueDate})` : " (no due date)"
          } — ${i.status}`
      )
    )}
    ${section(
      "Invoices due within 7 days",
      report.invoicesDueSoon.map((i) => `${i.invoiceNumber} — ${i.clientName} — ${money(i.total)} — due ${i.dueDate}`)
    )}
    <p style="margin-top:24px;color:#666;font-size:12px;">— Jaren CP</p>
  `;

  const { error } = await resend.emails.send({
    from: JAREN_FROM,
    to,
    subject: `System digest: ${orgName}`,
    html,
  });
  if (error) {
    console.error("Resend error sending system report email:", error);
    reportEmailFailure("system report", error);
    return false;
  }
  return true;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * One template for every Service Desk ticket notification. Everything passed in is
 * treated as plain text and escaped — ticket subjects and replies are user
 * content, including from client-portal users.
 */
export async function sendServiceDeskTicketEmail({
  to,
  subject,
  heading,
  intro,
  quote,
  ctaLabel,
  ctaUrl,
}: {
  to: string | string[];
  subject: string;
  heading: string;
  intro: string;
  quote?: string | null;
  ctaLabel: string;
  ctaUrl: string;
}): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping Service Desk ticket email.");
    return false;
  }

  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) return false;

  const trimmedQuote = quote ? (quote.length > 1500 ? `${quote.slice(0, 1500)}…` : quote) : null;

  const { error } = await resend.emails.send({
    from: FROM,
    to: recipients,
    subject,
    html: `
      <p style="margin:0 0 4px;color:#666;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">CP Service Manager Service Desk</p>
      <h2 style="margin:0 0 12px;font-size:18px;">${escapeHtml(heading)}</h2>
      <p>${escapeHtml(intro)}</p>
      ${
        trimmedQuote
          ? `<blockquote style="margin:16px 0;padding:8px 12px;border-left:3px solid #1d4ed8;color:#333;white-space:pre-wrap;">${escapeHtml(trimmedQuote)}</blockquote>`
          : ""
      }
      <p><a href="${escapeHtml(ctaUrl)}">${escapeHtml(ctaLabel)}</a></p>
      <p style="margin-top:24px;color:#666;font-size:12px;">Reply from the link above so your message stays on the ticket.</p>
    `,
  });
  if (error) {
    console.error("Resend error sending Service Desk ticket email:", error);
    reportEmailFailure("Service Desk ticket", error);
    return false;
  }
  return true;
}
