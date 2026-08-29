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
