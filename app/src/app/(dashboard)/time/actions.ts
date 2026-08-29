"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { sendTimecardApprovalEmail } from "@/lib/email/resend";

export interface TimeEntryFormState {
  error: string | null;
}

export interface TimecardFormState {
  error: string | null;
}

export interface ProjectFormState {
  error: string | null;
}

function generateProjectCode() {
  return `PRJ-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function createProject(
  clientId: string,
  _prev: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give this project a name." };

  const supabase = await createClient();
  const { error } = await supabase.from("projects").insert({
    org_id: org.orgId,
    client_id: clientId,
    name,
    project_code: generateProjectCode(),
    created_by: org.userId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}/time`);
  return { error: null };
}

export async function deleteProject(clientId: string, projectId: string) {
  const supabase = await createClient();
  await supabase.from("projects").delete().eq("id", projectId);
  revalidatePath(`/clients/${clientId}/time`);
}

export async function createTimeEntry(
  clientId: string,
  _prev: TimeEntryFormState,
  formData: FormData
): Promise<TimeEntryFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };

  const projectId = String(formData.get("project_id") ?? "").trim();
  if (!projectId) return { error: "Pick a project for this time entry." };

  const hoursRaw = String(formData.get("hours") ?? "").trim();
  const hours = Number(hoursRaw);
  if (!hoursRaw || Number.isNaN(hours) || hours <= 0) return { error: "Enter hours greater than 0." };

  const workDate = String(formData.get("work_date") ?? "").trim() || new Date().toISOString().slice(0, 10);
  const description = String(formData.get("description") ?? "").trim() || null;
  const contractId = String(formData.get("contract_id") ?? "").trim() || null;
  const billable = formData.get("billable") === "on";

  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").insert({
    org_id: org.orgId,
    client_id: clientId,
    project_id: projectId,
    contract_id: contractId,
    work_date: workDate,
    hours,
    description,
    billable,
    created_by: org.userId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}/time`);
  revalidatePath("/time");
  return { error: null };
}

export async function deleteTimeEntry(clientId: string, entryId: string) {
  const supabase = await createClient();
  await supabase.from("time_entries").delete().eq("id", entryId);
  revalidatePath(`/clients/${clientId}/time`);
  revalidatePath("/time");
}

const INTERNAL_APPROVER_ROLES = new Set(["owner", "admin"]);

function generateApprovalId() {
  return `APR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function createTimecard(
  clientId: string,
  _prev: TimecardFormState,
  formData: FormData
): Promise<TimecardFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };

  const periodStart = String(formData.get("period_start") ?? "").trim();
  const periodEnd = String(formData.get("period_end") ?? "").trim();
  if (!periodStart || !periodEnd) return { error: "Pick a start and end date." };

  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("time_entries")
    .select("id, hours, contract_id")
    .eq("client_id", clientId)
    .is("timecard_id", null)
    .eq("billable", true)
    .gte("work_date", periodStart)
    .lte("work_date", periodEnd);

  if (!entries || entries.length === 0) {
    return { error: "No unbilled billable time entries in that date range." };
  }

  const contractIds = [...new Set(entries.map((e) => e.contract_id).filter((v): v is string => !!v))];
  const { data: contracts } =
    contractIds.length > 0
      ? await supabase.from("client_contracts").select("id, hourly_rate").in("id", contractIds)
      : { data: [] as { id: string; hourly_rate: number | null }[] };

  const rateByContract = new Map((contracts ?? []).map((c) => [c.id, c.hourly_rate]));
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  let totalAmount: number | null = null;
  for (const entry of entries) {
    const rate = entry.contract_id ? rateByContract.get(entry.contract_id) : null;
    if (rate != null) totalAmount = (totalAmount ?? 0) + entry.hours * rate;
  }

  // Owners/admins submitting their own timecard are auto-approved internally
  // (stamped with a system approval ID); anyone else's submission is held in
  // "draft" until an owner/admin approves it via approveTimecardInternally.
  const autoApprove = INTERNAL_APPROVER_ROLES.has(org.role);

  const { data: timecard, error } = await supabase
    .from("timecards")
    .insert({
      org_id: org.orgId,
      client_id: clientId,
      period_start: periodStart,
      period_end: periodEnd,
      status: autoApprove ? "internally_approved" : "draft",
      total_hours: totalHours,
      total_amount: totalAmount,
      internal_approval_id: autoApprove ? generateApprovalId() : null,
      internal_approved_at: autoApprove ? new Date().toISOString() : null,
      internal_approved_by: autoApprove ? org.userId : null,
      created_by: org.userId,
    })
    .select("id")
    .single();

  if (error || !timecard) return { error: error?.message ?? "Failed to create timecard." };

  await supabase
    .from("time_entries")
    .update({ timecard_id: timecard.id })
    .in(
      "id",
      entries.map((e) => e.id)
    );

  revalidatePath(`/clients/${clientId}/time`);
  revalidatePath("/time");
  return { error: null };
}

export async function approveTimecardInternally(clientId: string, timecardId: string) {
  const org = await getCurrentOrg();
  if (!org || !INTERNAL_APPROVER_ROLES.has(org.role)) return;

  const supabase = await createClient();
  await supabase
    .from("timecards")
    .update({
      status: "internally_approved",
      internal_approval_id: generateApprovalId(),
      internal_approved_at: new Date().toISOString(),
      internal_approved_by: org.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", timecardId)
    .eq("status", "draft");

  revalidatePath(`/clients/${clientId}/time`);
  revalidatePath("/time");
}

export async function sendTimecardToClient(
  clientId: string,
  timecardId: string,
  _prev: TimecardFormState,
  formData: FormData
): Promise<TimecardFormState> {
  const approverName = String(formData.get("approver_name") ?? "").trim();
  const approverEmail = String(formData.get("approver_email") ?? "").trim();
  if (!approverName || !approverEmail) return { error: "Approver name and email are required." };

  const supabase = await createClient();
  const { data: timecard } = await supabase
    .from("timecards")
    .select("id, status, period_start, period_end, total_hours, approval_token")
    .eq("id", timecardId)
    .single();

  if (!timecard) return { error: "Timecard not found." };
  if (timecard.status !== "internally_approved") {
    return { error: "This timecard needs internal approval before it can be sent." };
  }

  const { error } = await supabase
    .from("timecards")
    .update({
      status: "sent",
      approver_name: approverName,
      approver_email: approverEmail,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", timecardId);

  if (error) return { error: error.message };

  const { data: client } = await supabase.from("clients").select("name").eq("id", clientId).single();

  await sendTimecardApprovalEmail({
    to: approverEmail,
    approverName,
    clientName: client?.name ?? "your organization",
    periodStart: timecard.period_start,
    periodEnd: timecard.period_end,
    totalHours: timecard.total_hours,
    reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/timecard/${timecard.approval_token}`,
  });

  revalidatePath(`/clients/${clientId}/time`);
  revalidatePath("/time");
  return { error: null };
}
