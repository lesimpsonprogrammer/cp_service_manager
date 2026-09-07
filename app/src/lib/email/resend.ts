import { Resend } from "resend";
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
}) {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping contract signing email.");
    return;
  }

  await resend.emails.send({
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
}) {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping contract reminder email.");
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Reminder: ${contractName} is awaiting your signature`,
    html: `
      <p>Hi ${signerName},</p>
      <p>This is a reminder that ${clientName} is still waiting on your signature for <strong>${contractName}</strong>.</p>
      <p><a href="${signingUrl}">Review and sign the contract</a></p>
    `,
  });
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
}) {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping timecard approval email.");
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Timecard for review: ${periodStart} – ${periodEnd}`,
    html: `
      <p>Hi ${approverName},</p>
      <p>${clientName}'s timecard for ${periodStart} – ${periodEnd} (${totalHours} hours) is ready for your review.</p>
      <p><a href="${reviewUrl}">Review and approve the timecard</a></p>
    `,
  });
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
}) {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping timecard decision email.");
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Timecard ${approved ? "approved" : "rejected"}: ${periodStart} – ${periodEnd}`,
    html: approved
      ? `<p>${decidedByName} approved ${clientName}'s timecard for ${periodStart} – ${periodEnd}.</p>`
      : `<p>${decidedByName} rejected ${clientName}'s timecard for ${periodStart} – ${periodEnd}.${reason ? ` Reason: ${reason}` : ""}</p>`,
  });
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
}) {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping client portal invite email.");
    return;
  }

  await resend.emails.send({
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
}) {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping project stage change email.");
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${projectName} moved to "${stageLabel}"`,
    html: `
      <p>Hi,</p>
      <p>${clientName}'s project <strong>${projectName}</strong> (${projectCode}) just moved to <strong>${stageLabel}</strong>.</p>
      <p><a href="${portalUrl}">View it in your client portal</a></p>
    `,
  });
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
}) {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping pipeline run client email.");
    return;
  }

  const succeeded = status === "succeeded";

  await resend.emails.send({
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
}) {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping signed notification email.");
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Signed: ${contractName}`,
    html: `<p>${signedByName} just signed <strong>${contractName}</strong> for ${clientName}.</p>`,
  });
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
}) {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping invoice email.");
    return;
  }

  const amount = `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  await resend.emails.send({
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
}) {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping system report email.");
    return;
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

  await resend.emails.send({
    from: JAREN_FROM,
    to,
    subject: `System digest: ${orgName}`,
    html,
  });
}
