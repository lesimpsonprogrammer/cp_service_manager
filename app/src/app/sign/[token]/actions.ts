"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendContractSignedNotification } from "@/lib/email/resend";

export interface SignFormState {
  error: string | null;
}

const STAGE_ORDER = ["not_started", "contract_sent", "contract_signed", "in_progress", "completed"];

export async function submitSignature(
  token: string,
  _prev: SignFormState,
  formData: FormData
): Promise<SignFormState> {
  const typedName = String(formData.get("typed_name") ?? "").trim();
  const agreed = formData.get("agree") === "on";

  if (!typedName) return { error: "Type your full legal name to sign." };
  if (!agreed) return { error: "You must confirm you agree to the terms before signing." };

  const admin = createAdminClient();
  const { data: contract } = await admin
    .from("client_contracts")
    .select("id, org_id, client_id, name, status, created_by")
    .eq("signing_token", token)
    .single();

  if (!contract) return { error: "This signing link is invalid." };
  if (contract.status === "signed" || contract.status === "active") {
    return { error: "This contract has already been signed." };
  }
  if (contract.status !== "sent") {
    return { error: "This contract is not ready to be signed yet." };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headerList.get("x-real-ip") ?? "unknown";

  const { error } = await admin
    .from("client_contracts")
    .update({
      status: "signed",
      signed_at: new Date().toISOString(),
      signed_by_name: typedName,
      signer_ip: ip,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contract.id);

  if (error) return { error: error.message };

  const { data: clientRow } = await admin
    .from("clients")
    .select("name, onboarding_stage")
    .eq("id", contract.client_id)
    .single();

  if (clientRow && STAGE_ORDER.indexOf("contract_signed") > STAGE_ORDER.indexOf(clientRow.onboarding_stage)) {
    await admin
      .from("clients")
      .update({ onboarding_stage: "contract_signed", updated_at: new Date().toISOString() })
      .eq("id", contract.client_id);
  }

  if (contract.created_by) {
    const { data: userRes } = await admin.auth.admin.getUserById(contract.created_by);
    const notifyEmail = userRes?.user?.email;
    if (notifyEmail) {
      await sendContractSignedNotification({
        to: notifyEmail,
        clientName: clientRow?.name ?? "a client",
        contractName: contract.name,
        signedByName: typedName,
      });
    }
  }

  revalidatePath(`/clients/${contract.client_id}/onboarding`);
  revalidatePath(`/sign/${token}`);
  return { error: null };
}
