import { createAdminClient } from "@/lib/supabase/admin";
import { sendContractReminderEmail } from "@/lib/email/resend";

const REMINDER_INTERVAL_DAYS = 3;
const MAX_REMINDERS = 5;

/**
 * Finds contracts sitting in "sent" for REMINDER_INTERVAL_DAYS+ without a
 * recent reminder and emails the signer again. Called by the daily cron
 * route; uses the admin client since it runs with no signed-in user.
 */
export async function sendDueContractReminders(): Promise<{ remindersSent: number }> {
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - REMINDER_INTERVAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: contracts } = await admin
    .from("client_contracts")
    .select("id, client_id, name, signer_name, signer_email, signing_token, sent_at, last_reminder_at, reminder_count")
    .eq("status", "sent")
    .lt("reminder_count", MAX_REMINDERS);

  if (!contracts) return { remindersSent: 0 };

  let remindersSent = 0;

  for (const contract of contracts) {
    const lastTouch = contract.last_reminder_at ?? contract.sent_at;
    if (!lastTouch || !contract.signer_email || lastTouch > cutoff) continue;

    const { data: client } = await admin.from("clients").select("name").eq("id", contract.client_id).single();

    await sendContractReminderEmail({
      to: contract.signer_email,
      signerName: contract.signer_name ?? "there",
      clientName: client?.name ?? "your organization",
      contractName: contract.name,
      signingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/sign/${contract.signing_token}`,
    });

    await admin
      .from("client_contracts")
      .update({
        last_reminder_at: new Date().toISOString(),
        reminder_count: contract.reminder_count + 1,
      })
      .eq("id", contract.id);

    remindersSent += 1;
  }

  return { remindersSent };
}
