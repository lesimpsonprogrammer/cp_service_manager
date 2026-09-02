import type { ConnectorField } from "@/lib/connectors/types";
import type { AccountingConnectionType } from "@/types/database";

export interface AccountingConnectionTypeDefinition {
  type: AccountingConnectionType;
  label: string;
  description: string;
  icon: string;
}

export const ACCOUNTING_CONNECTION_TYPES: AccountingConnectionTypeDefinition[] = [
  {
    type: "billing_system",
    label: "Billing System",
    description: "Where client invoices ultimately post — keeps every client's Invoices sub-account in sync.",
    icon: "🧾",
  },
  {
    type: "pos",
    label: "Point of Sale (POS)",
    description: "Sales/payment capture, if the org takes point-of-sale payments in addition to invoicing.",
    icon: "🛒",
  },
  {
    type: "general_ledger",
    label: "General Ledger",
    description: "The books of record every client sub-account's Accounting activity rolls up into.",
    icon: "📒",
  },
];

export function getAccountingConnectionTypeDefinition(type: string) {
  return ACCOUNTING_CONNECTION_TYPES.find((c) => c.type === type);
}

/**
 * Setup fields for each connection slot. For now every slot is modeled on
 * QuickBooks (the reference accounting software) — `provider` is still
 * stored per-connection so a different provider's fields can be added here
 * later without a schema change.
 */
export const QUICKBOOKS_FIELDS: ConnectorField[] = [
  { key: "company_name", label: "QuickBooks company name", type: "text", required: true, placeholder: "Momentum Data Solutions" },
  {
    key: "realm_id",
    label: "Company ID (Realm ID)",
    type: "text",
    required: true,
    helpText: "Found in QuickBooks under Settings → Account and settings → Billing, or in the app URL after connecting.",
  },
  {
    key: "environment",
    label: "Environment",
    type: "select",
    required: true,
    options: [
      { label: "Sandbox", value: "sandbox" },
      { label: "Production", value: "production" },
    ],
    defaultValue: "sandbox",
  },
  { key: "client_id", label: "Client ID", type: "text", required: true, helpText: "From your app's keys on the Intuit Developer portal." },
  { key: "client_secret", label: "Client Secret", type: "password", secret: true, required: true },
  {
    key: "chart_of_accounts_sync",
    label: "Sync chart of accounts",
    type: "select",
    options: [
      { label: "Yes", value: "true" },
      { label: "No", value: "false" },
    ],
    defaultValue: "true",
  },
  {
    key: "fiscal_year_start_month",
    label: "Fiscal year start month",
    type: "select",
    options: [
      { label: "January", value: "1" },
      { label: "February", value: "2" },
      { label: "March", value: "3" },
      { label: "April", value: "4" },
      { label: "May", value: "5" },
      { label: "June", value: "6" },
      { label: "July", value: "7" },
      { label: "August", value: "8" },
      { label: "September", value: "9" },
      { label: "October", value: "10" },
      { label: "November", value: "11" },
      { label: "December", value: "12" },
    ],
    defaultValue: "1",
  },
];

export function getAccountingConnectionFields(): ConnectorField[] {
  // Only QuickBooks for now — see module docstring.
  return QUICKBOOKS_FIELDS;
}
