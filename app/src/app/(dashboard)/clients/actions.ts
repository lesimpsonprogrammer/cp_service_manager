"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import type { ClientStatus, ContractStatus, OnboardingStage } from "@/types/database";

export interface ClientFormState {
  error: string | null;
}

export interface ContractFormState {
  error: string | null;
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

export async function updateOnboardingStage(clientId: string, stage: OnboardingStage) {
  const supabase = await createClient();
  await supabase
    .from("clients")
    .update({ onboarding_stage: stage, updated_at: new Date().toISOString() })
    .eq("id", clientId);

  revalidatePath(`/clients/${clientId}`);
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

  const supabase = await createClient();
  const { error } = await supabase.from("client_contracts").insert({
    org_id: org.orgId,
    client_id: clientId,
    name,
    status: "draft",
    start_date: startDate,
    end_date: endDate,
    value: valueRaw ? Number(valueRaw) : null,
    notes,
    created_by: org.userId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`);
  return { error: null };
}

export async function updateContractStatus(clientId: string, contractId: string, status: ContractStatus) {
  const supabase = await createClient();
  await supabase
    .from("client_contracts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", contractId);

  revalidatePath(`/clients/${clientId}`);
}

export async function deleteContract(clientId: string, contractId: string) {
  const supabase = await createClient();
  await supabase.from("client_contracts").delete().eq("id", contractId);
  revalidatePath(`/clients/${clientId}`);
}
