"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTimecardDecisionNotification } from "@/lib/email/resend";

export interface TimecardDecisionState {
  error: string | null;
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function notifyDecision(
  admin: AdminClient,
  timecard: { client_id: string; period_start: string; period_end: string; created_by: string | null },
  approved: boolean,
  decidedByName: string,
  reason: string | null
) {
  const { data: client } = await admin.from("clients").select("name").eq("id", timecard.client_id).single();
  if (!timecard.created_by) return;

  const { data: userRes } = await admin.auth.admin.getUserById(timecard.created_by);
  const notifyEmail = userRes?.user?.email;
  if (!notifyEmail) return;

  await sendTimecardDecisionNotification({
    to: notifyEmail,
    clientName: client?.name ?? "a client",
    periodStart: timecard.period_start,
    periodEnd: timecard.period_end,
    approved,
    decidedByName,
    reason,
  });
}

export async function approveTimecard(
  token: string,
  _prev: TimecardDecisionState,
  formData: FormData
): Promise<TimecardDecisionState> {
  const typedName = String(formData.get("typed_name") ?? "").trim();
  if (!typedName) return { error: "Type your name to approve." };

  const admin = createAdminClient();
  const { data: timecard } = await admin
    .from("timecards")
    .select("id, status, client_id, period_start, period_end, created_by")
    .eq("approval_token", token)
    .single();

  if (!timecard) return { error: "This review link is invalid." };
  if (timecard.status !== "sent") return { error: "This timecard is not awaiting review." };

  const { error } = await admin
    .from("timecards")
    .update({
      status: "client_approved",
      client_approved_at: new Date().toISOString(),
      client_approved_by_name: typedName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", timecard.id);

  if (error) return { error: error.message };

  await notifyDecision(admin, timecard, true, typedName, null);

  revalidatePath(`/timecard/${token}`);
  return { error: null };
}

export async function rejectTimecard(
  token: string,
  _prev: TimecardDecisionState,
  formData: FormData
): Promise<TimecardDecisionState> {
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "Give a reason for rejecting this timecard." };

  const admin = createAdminClient();
  const { data: timecard } = await admin
    .from("timecards")
    .select("id, status, client_id, period_start, period_end, created_by")
    .eq("approval_token", token)
    .single();

  if (!timecard) return { error: "This review link is invalid." };
  if (timecard.status !== "sent") return { error: "This timecard is not awaiting review." };

  const { error } = await admin
    .from("timecards")
    .update({
      status: "client_rejected",
      client_rejected_at: new Date().toISOString(),
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", timecard.id);

  if (error) return { error: error.message };

  await notifyDecision(admin, timecard, false, "the client", reason);

  revalidatePath(`/timecard/${token}`);
  return { error: null };
}
