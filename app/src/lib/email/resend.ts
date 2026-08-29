import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL ?? "notifications@cpservicemanager.com";

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
