"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { sendContractSigningEmail, sendContractReminderEmail, sendClientPortalInviteEmail } from "@/lib/email/resend";
import type { ClientStatus, ContractStatus, Database, OnboardingStage } from "@/types/database";

type ContractUpdate = Database["public"]["Tables"]["client_contracts"]["Update"];

export interface ClientFormState {
  error: string | null;
}

export interface ClientPortalInviteFormState {
  error: string | null;
}

export interface ContractFormState {
  error: string | null;
}

export interface BillingFormState {
  error: string | null;
}

export interface ComplianceFormState {
  error: string | null;
}

const STAGE_ORDER: OnboardingStage[] = [
  "not_started",
  "contract_sent",
  "contract_signed",
  "in_progress",
  "completed",
];

async function bumpOnboardingStage(clientId: string, target: OnboardingStage) {
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("onboarding_stage").eq("id", clientId).single();
  if (!data) return;
  if (STAGE_ORDER.indexOf(target) > STAGE_ORDER.indexOf(data.onboarding_stage)) {
    await supabase
      .from("clients")
      .update({ onboarding_stage: target, updated_at: new Date().toISOString() })
      .eq("id", clientId);
  }
}

function readClientFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    status: (String(formData.get("status") ?? "active") as ClientStatus),
    primary_contact_name: String(formData.get("primary_contact_name") ?? "").trim() || null,
    primary_contact_email: String(formData.get("primary_contact_email") ?? "").trim() || null,
    primary_contact_phone: String(formData.get("primary_contact_phone") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

export async function createClientRecord(
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };

  const fields = readClientFields(formData);
  if (!fields.name) return { error: "Give this client a name." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ org_id: org.orgId, created_by: org.userId, ...fields })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create client." };
  }

  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

export async function updateClientRecord(
  clientId: string,
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const fields = readClientFields(formData);
  if (!fields.name) return { error: "Give this client a name." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", clientId);

  if (error) return { error: error.message };

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

export async function updateClientStatus(clientId: string, status: ClientStatus) {
  const supabase = await createClient();
  await supabase
    .from("clients")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", clientId);

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteClientRecord(clientId: string) {
  const supabase = await createClient();
  await supabase.from("clients").delete().eq("id", clientId);
  revalidatePath("/clients");
  redirect("/clients");
}

export async function updateClientBilling(
  clientId: string,
  _prev: BillingFormState,
  formData: FormData
): Promise<BillingFormState> {
  const str = (key: string) => String(formData.get(key) ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      billing_contact_name: str("billing_contact_name"),
      billing_contact_email: str("billing_contact_email"),
      billing_contact_phone: str("billing_contact_phone"),
      momentum_billing_contact_name: str("momentum_billing_contact_name"),
      momentum_billing_contact_email: str("momentum_billing_contact_email"),
      payment_terms: str("payment_terms"),
      payment_method: str("payment_method"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId);

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}/accounting`);
  return { error: null };
}

export async function updateClientCompliance(
  clientId: string,
  _prev: ComplianceFormState,
  formData: FormData
): Promise<ComplianceFormState> {
  const frameworks = formData.getAll("compliance_frameworks").map((v) => String(v));
  const hipaa = formData.get("hipaa_covered_entity") === "on";
  const notes = String(formData.get("compliance_notes") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      compliance_frameworks: frameworks,
      hipaa_covered_entity: hipaa,
      compliance_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId);

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}/compliance`);
  return { error: null };
}

export async function createContract(
  clientId: string,
  _prev: ContractFormState,
  formData: FormData
): Promise<ContractFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give this contract a name." };

  const startDate = String(formData.get("start_date") ?? "").trim() || null;
  const endDate = String(formData.get("end_date") ?? "").trim() || null;
  const valueRaw = String(formData.get("value") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const clientAddress = String(formData.get("client_address") ?? "").trim() || null;
  const servicesDescription = String(formData.get("services_description") ?? "").trim() || null;
  const hourlyRateRaw = String(formData.get("hourly_rate") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.from("client_contracts").insert({
    org_id: org.orgId,
    client_id: clientId,
    name,
    status: "draft",
    start_date: startDate,
    end_date: endDate,
    value: valueRaw ? Number(valueRaw) : null,
    hourly_rate: hourlyRateRaw ? Number(hourlyRateRaw) : null,
    notes,
    client_address: clientAddress,
    services_description: servicesDescription,
    created_by: org.userId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}/contracts`);
  revalidatePath(`/clients/${clientId}/onboarding`);
  return { error: null };
}

export async function updateContract(
  clientId: string,
  contractId: string,
  _prev: ContractFormState,
  formData: FormData
): Promise<ContractFormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give this contract a name." };

  const startDate = String(formData.get("start_date") ?? "").trim() || null;
  const endDate = String(formData.get("end_date") ?? "").trim() || null;
  const valueRaw = String(formData.get("value") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const clientAddress = String(formData.get("client_address") ?? "").trim() || null;
  const servicesDescription = String(formData.get("services_description") ?? "").trim() || null;
  const hourlyRateRaw = String(formData.get("hourly_rate") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_contracts")
    .update({
      name,
      start_date: startDate,
      end_date: endDate,
      value: valueRaw ? Number(valueRaw) : null,
      hourly_rate: hourlyRateRaw ? Number(hourlyRateRaw) : null,
      notes,
      client_address: clientAddress,
      services_description: servicesDescription,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId);

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}/contracts`);
  revalidatePath(`/clients/${clientId}/onboarding`);
  redirect(`/clients/${clientId}/contracts`);
}

export async function updateContractStatus(clientId: string, contractId: string, status: ContractStatus) {
  const supabase = await createClient();
  await supabase
    .from("client_contracts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", contractId);

  revalidatePath(`/clients/${clientId}/contracts`);
  revalidatePath(`/clients/${clientId}/onboarding`);
}

export async function approveContract(clientId: string, contractId: string) {
  const org = await getCurrentOrg();
  if (!org) return;

  const supabase = await createClient();
  await supabase
    .from("client_contracts")
    .update({
      approved_at: new Date().toISOString(),
      approved_by: org.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId);

  revalidatePath(`/clients/${clientId}/onboarding`);
  revalidatePath(`/clients/${clientId}/contracts`);
}

export async function sendContractForSignature(
  clientId: string,
  contractId: string,
  _prev: ContractFormState,
  formData: FormData
): Promise<ContractFormState> {
  const signerName = String(formData.get("signer_name") ?? "").trim();
  const signerEmail = String(formData.get("signer_email") ?? "").trim();
  if (!signerName || !signerEmail) return { error: "Signer name and email are required." };

  const supabase = await createClient();
  const { data: contract } = await supabase
    .from("client_contracts")
    .select("id, name, signing_token, approved_at")
    .eq("id", contractId)
    .single();

  if (!contract) return { error: "Contract not found." };
  if (!contract.approved_at) return { error: "Approve this contract before sending it." };

  const { error } = await supabase
    .from("client_contracts")
    .update({
      status: "sent",
      signer_name: signerName,
      signer_email: signerEmail,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId);

  if (error) return { error: error.message };

  const { data: client } = await supabase.from("clients").select("name").eq("id", clientId).single();
  const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${contract.signing_token}`;

  await sendContractSigningEmail({
    to: signerEmail,
    signerName,
    clientName: client?.name ?? "your organization",
    contractName: contract.name,
    signingUrl,
  });

  await bumpOnboardingStage(clientId, "contract_sent");

  revalidatePath(`/clients/${clientId}/onboarding`);
  revalidatePath(`/clients/${clientId}/contracts`);
  return { error: null };
}

export async function sendContractReminderNow(clientId: string, contractId: string) {
  const supabase = await createClient();
  const { data: contract } = await supabase
    .from("client_contracts")
    .select("id, name, status, signer_name, signer_email, signing_token, reminder_count")
    .eq("id", contractId)
    .single();

  if (!contract || contract.status !== "sent" || !contract.signer_email) return;

  const { data: client } = await supabase.from("clients").select("name").eq("id", clientId).single();

  await sendContractReminderEmail({
    to: contract.signer_email,
    signerName: contract.signer_name ?? "there",
    clientName: client?.name ?? "your organization",
    contractName: contract.name,
    signingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/sign/${contract.signing_token}`,
  });

  await supabase
    .from("client_contracts")
    .update({ last_reminder_at: new Date().toISOString(), reminder_count: contract.reminder_count + 1 })
    .eq("id", contractId);

  revalidatePath(`/clients/${clientId}/onboarding`);
}

export async function overrideContractStatus(clientId: string, contractId: string, status: ContractStatus) {
  const supabase = await createClient();
  const updates: ContractUpdate = { status, updated_at: new Date().toISOString() };

  if (status === "signed") {
    updates.signed_at = new Date().toISOString();
    updates.signed_by_name = "Manually confirmed (no e-signature)";
    updates.signer_ip = null;
  }

  await supabase.from("client_contracts").update(updates).eq("id", contractId);

  if (status === "signed" || status === "active") {
    await bumpOnboardingStage(clientId, "contract_signed");
  }

  revalidatePath(`/clients/${clientId}/onboarding`);
  revalidatePath(`/clients/${clientId}/contracts`);
}

export async function purgeContractSigning(clientId: string, contractId: string) {
  const supabase = await createClient();
  await supabase
    .from("client_contracts")
    .update({
      status: "draft",
      approved_at: null,
      approved_by: null,
      sent_at: null,
      signed_at: null,
      signer_name: null,
      signer_email: null,
      signed_by_name: null,
      signer_ip: null,
      signing_token: crypto.randomUUID(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId);

  await supabase
    .from("clients")
    .update({ onboarding_stage: "not_started", updated_at: new Date().toISOString() })
    .eq("id", clientId);

  revalidatePath(`/clients/${clientId}/onboarding`);
  revalidatePath(`/clients/${clientId}/contracts`);
}

export async function deleteContract(clientId: string, contractId: string) {
  const supabase = await createClient();
  await supabase.from("client_contracts").delete().eq("id", contractId);
  revalidatePath(`/clients/${clientId}/contracts`);
  revalidatePath(`/clients/${clientId}/onboarding`);
}

export async function inviteClientPortalUser(
  clientId: string,
  _prev: ClientPortalInviteFormState,
  formData: FormData
): Promise<ClientPortalInviteFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter an email address to invite." };

  const supabase = await createClient();

  const { data: client } = await supabase.from("clients").select("name").eq("id", clientId).single();
  if (!client) return { error: "Client not found." };

  const { data: invite, error } = await supabase
    .from("client_portal_invites")
    .insert({ org_id: org.orgId, client_id: clientId, email, invited_by: org.userId })
    .select("token")
    .single();

  if (error || !invite) return { error: error?.message ?? "Failed to create invite." };

  await sendClientPortalInviteEmail({
    to: email,
    clientName: client.name,
    invitedByName: org.userEmail ?? "Your service provider",
    acceptUrl: `${process.env.NEXT_PUBLIC_APP_URL}/client/accept?token=${invite.token}&email=${encodeURIComponent(email)}`,
  });

  revalidatePath(`/clients/${clientId}/portal`);
  return { error: null };
}

export async function revokeClientPortalUser(clientId: string, userId: string) {
  const supabase = await createClient();
  await supabase.from("client_portal_users").delete().eq("id", userId).eq("client_id", clientId);
  revalidatePath(`/clients/${clientId}/portal`);
}

export async function revokeClientPortalInvite(clientId: string, inviteId: string) {
  const supabase = await createClient();
  await supabase.from("client_portal_invites").delete().eq("id", inviteId).eq("client_id", clientId);
  revalidatePath(`/clients/${clientId}/portal`);
}
