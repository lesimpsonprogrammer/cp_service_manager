import { createAdminClient } from "@/lib/supabase/admin";
import { sendGlassTicketEmail } from "@/lib/email/resend";
import { ACTIVE_STATUSES, AUTO_CLOSE_AFTER_DAYS, PAUSED_STATUSES } from "./constants";
import { staffTicketUrl } from "./notify";
import { getUserEmails } from "./people";
import { getSlaSnapshot } from "./sla";

export interface GlassMaintenanceResult {
  autoClosed: number;
  breachAlerts: number;
  errors: string[];
}

/**
 * Daily housekeeping (Vercel Cron → /api/cron/glass):
 *   1. Close resolved tickets that have been quiet for AUTO_CLOSE_AFTER_DAYS.
 *   2. Email the owner (or the workspace admins, if unassigned) once per
 *      ticket when an SLA is breached. `sla_breach_notified_at` makes it
 *      idempotent; the trigger clears it on reopen or priority change.
 */
export async function runGlassMaintenance(now = new Date()): Promise<GlassMaintenanceResult> {
  const admin = createAdminClient();
  const result: GlassMaintenanceResult = { autoClosed: 0, breachAlerts: 0, errors: [] };

  const cutoff = new Date(now.getTime() - AUTO_CLOSE_AFTER_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: stale, error: staleError } = await admin
    .from("tickets")
    .select("id")
    .eq("status", "resolved")
    .lt("resolved_at", cutoff)
    .lt("last_activity_at", cutoff)
    .limit(1000);
  if (staleError) result.errors.push(`auto-close lookup: ${staleError.message}`);

  if (stale?.length) {
    const { error } = await admin
      .from("tickets")
      .update({ status: "closed", updated_by: null })
      .in("id", stale.map((t) => t.id))
      .eq("status", "resolved");
    if (error) result.errors.push(`auto-close: ${error.message}`);
    else result.autoClosed = stale.length;
  }

  const { data: candidates, error: breachError } = await admin
    .from("tickets")
    .select(
      "id, org_id, ticket_number, subject, priority, status, assignee_id, first_response_due_at, resolution_due_at, first_responded_at, resolved_at, sla_paused_at"
    )
    .in("status", ACTIVE_STATUSES.filter((s) => !PAUSED_STATUSES.includes(s)))
    .is("sla_breach_notified_at", null)
    .lt("first_response_due_at", now.toISOString())
    .limit(500);
  if (breachError) result.errors.push(`breach lookup: ${breachError.message}`);

  // first_response_due_at is always <= resolution_due_at, so the filter above
  // is a cheap superset; the snapshot decides what's actually breached.
  const breached = (candidates ?? []).filter((t) => getSlaSnapshot(t, now).overall === "breached").slice(0, 200);
  const adminsByOrg = new Map<string, string[]>();

  for (const ticket of breached) {
    try {
      let recipients: string[];
      if (ticket.assignee_id) {
        recipients = Array.from((await getUserEmails(admin, [ticket.assignee_id])).values());
      } else {
        if (!adminsByOrg.has(ticket.org_id)) {
          const { data: admins } = await admin
            .from("org_members")
            .select("user_id")
            .eq("org_id", ticket.org_id)
            .in("role", ["owner", "admin"]);
          adminsByOrg.set(
            ticket.org_id,
            Array.from((await getUserEmails(admin, (admins ?? []).map((a) => a.user_id))).values())
          );
        }
        recipients = adminsByOrg.get(ticket.org_id) ?? [];
      }

      if (recipients.length) {
        await sendGlassTicketEmail({
          to: recipients,
          subject: `[${ticket.ticket_number}] SLA breached: ${ticket.subject}`,
          heading: `${ticket.ticket_number} is past its SLA`,
          intro: ticket.assignee_id
            ? `This ${ticket.priority} ticket assigned to you is overdue.`
            : `This ${ticket.priority} ticket is overdue and has no owner — please assign it.`,
          ctaLabel: "Open the ticket in GLASS",
          ctaUrl: staffTicketUrl(ticket.id),
        });
      }

      await admin.from("tickets").update({ sla_breach_notified_at: now.toISOString() }).eq("id", ticket.id);
      result.breachAlerts += 1;
    } catch (err) {
      result.errors.push(`${ticket.ticket_number}: ${err instanceof Error ? err.message : "alert failed"}`);
    }
  }

  return result;
}
