"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { sendInvoiceEmail } from "@/lib/email/resend";

export interface InvoiceFormState {
  error: string | null;
}

function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `INV-${year}-${suffix}`;
}

function revalidateInvoicePaths(clientId: string) {
  revalidatePath(`/clients/${clientId}/invoices`);
  revalidatePath("/invoices");
}

export async function createInvoice(
  clientId: string,
  _prev: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  const org = await getCurrentOrg();
  if (!org) return { error: "Not signed in." };

  const descriptions = formData.getAll("description").map((v) => String(v).trim());
  const quantities = formData.getAll("quantity").map((v) => Number(v));
  const unitPrices = formData.getAll("unit_price").map((v) => Number(v));

  const lineItems = descriptions
    .map((description, i) => ({
      description,
      quantity: quantities[i] || 0,
      unit_price: unitPrices[i] || 0,
    }))
    .filter((item) => item.description && item.quantity > 0);

  if (lineItems.length === 0) {
    return { error: "Add at least one line item with a description and quantity." };
  }

  const dueDate = String(formData.get("due_date") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const contractId = String(formData.get("contract_id") ?? "").trim() || null;
  const taxRate = Number(formData.get("tax_rate") ?? 0) || 0;
  const billingContactName = String(formData.get("billing_contact_name") ?? "").trim() || null;
  const billingContactEmail = String(formData.get("billing_contact_email") ?? "").trim() || null;

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const supabase = await createClient();
  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      org_id: org.orgId,
      client_id: clientId,
      contract_id: contractId,
      invoice_number: generateInvoiceNumber(),
      due_date: dueDate,
      notes,
      tax_rate: taxRate,
      subtotal,
      tax_amount: taxAmount,
      total,
      billing_contact_name: billingContactName,
      billing_contact_email: billingContactEmail,
      created_by: org.userId,
    })
    .select("id")
    .single();

  if (error || !invoice) return { error: error?.message ?? "Failed to create invoice." };

  const { error: itemsError } = await supabase.from("invoice_line_items").insert(
    lineItems.map((item, i) => ({
      invoice_id: invoice.id,
      org_id: org.orgId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.quantity * item.unit_price,
      sort_order: i,
    }))
  );

  if (itemsError) return { error: itemsError.message };

  revalidateInvoicePaths(clientId);
  redirect(`/clients/${clientId}/invoices/${invoice.id}`);
}

export async function createInvoiceFromTimecard(clientId: string, timecardId: string) {
  const org = await getCurrentOrg();
  if (!org) return;

  const supabase = await createClient();
  const { data: timecard } = await supabase
    .from("timecards")
    .select("id, period_start, period_end, total_hours, total_amount")
    .eq("id", timecardId)
    .single();

  if (!timecard) return;

  const { data: client } = await supabase
    .from("clients")
    .select("billing_contact_name, billing_contact_email")
    .eq("id", clientId)
    .single();

  const { data: entries } = await supabase
    .from("time_entries")
    .select("contract_id")
    .eq("timecard_id", timecardId)
    .limit(1);

  const contractId = entries?.[0]?.contract_id ?? null;
  const { data: contract } = contractId
    ? await supabase.from("client_contracts").select("hourly_rate").eq("id", contractId).single()
    : { data: null as { hourly_rate: number | null } | null };

  const rate = contract?.hourly_rate ?? (timecard.total_hours > 0 ? (timecard.total_amount ?? 0) / timecard.total_hours : 0);
  const amount = timecard.total_amount ?? timecard.total_hours * rate;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      org_id: org.orgId,
      client_id: clientId,
      contract_id: contractId,
      timecard_id: timecardId,
      invoice_number: generateInvoiceNumber(),
      subtotal: amount,
      tax_amount: 0,
      total: amount,
      billing_contact_name: client?.billing_contact_name ?? null,
      billing_contact_email: client?.billing_contact_email ?? null,
      created_by: org.userId,
    })
    .select("id")
    .single();

  if (error || !invoice) return;

  await supabase.from("invoice_line_items").insert({
    invoice_id: invoice.id,
    org_id: org.orgId,
    description: `Professional services: ${timecard.period_start} – ${timecard.period_end} (${timecard.total_hours}h)`,
    quantity: timecard.total_hours,
    unit_price: rate,
    amount,
    sort_order: 0,
  });

  revalidateInvoicePaths(clientId);
  redirect(`/clients/${clientId}/invoices/${invoice.id}`);
}

export async function sendInvoiceToClient(
  clientId: string,
  invoiceId: string,
  _prev: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  const contactName = String(formData.get("billing_contact_name") ?? "").trim();
  const contactEmail = String(formData.get("billing_contact_email") ?? "").trim();
  if (!contactName || !contactEmail) return { error: "Billing contact name and email are required." };

  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, status, invoice_number, total, due_date")
    .eq("id", invoiceId)
    .single();

  if (!invoice) return { error: "Invoice not found." };
  if (invoice.status !== "draft") return { error: "Only draft invoices can be sent." };

  const { error } = await supabase
    .from("invoices")
    .update({
      status: "sent",
      billing_contact_name: contactName,
      billing_contact_email: contactEmail,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  if (error) return { error: error.message };

  const { data: client } = await supabase.from("clients").select("name").eq("id", clientId).single();

  await sendInvoiceEmail({
    to: contactEmail,
    contactName,
    clientName: client?.name ?? "your organization",
    invoiceNumber: invoice.invoice_number,
    total: invoice.total,
    dueDate: invoice.due_date,
    invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/clients/${clientId}/invoices/${invoiceId}/pdf`,
  });

  revalidateInvoicePaths(clientId);
  return { error: null };
}

export async function markInvoicePaid(clientId: string, invoiceId: string) {
  const org = await getCurrentOrg();
  if (!org) return;

  const supabase = await createClient();
  await supabase
    .from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", invoiceId)
    .in("status", ["sent", "overdue"]);

  revalidateInvoicePaths(clientId);
}

export async function markInvoiceOverdue(clientId: string, invoiceId: string) {
  const org = await getCurrentOrg();
  if (!org) return;

  const supabase = await createClient();
  await supabase
    .from("invoices")
    .update({ status: "overdue", updated_at: new Date().toISOString() })
    .eq("id", invoiceId)
    .eq("status", "sent");

  revalidateInvoicePaths(clientId);
}

export async function voidInvoice(clientId: string, invoiceId: string) {
  const org = await getCurrentOrg();
  if (!org) return;

  const supabase = await createClient();
  await supabase
    .from("invoices")
    .update({ status: "void", updated_at: new Date().toISOString() })
    .eq("id", invoiceId)
    .neq("status", "paid");

  revalidateInvoicePaths(clientId);
}

export async function deleteInvoice(clientId: string, invoiceId: string) {
  const supabase = await createClient();
  await supabase.from("invoices").delete().eq("id", invoiceId).eq("status", "draft");
  revalidateInvoicePaths(clientId);
}
