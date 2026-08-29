export const AGREEMENT_PLACEHOLDERS = [
  "{{client_name}}",
  "{{client_address}}",
  "{{org_name}}",
  "{{contract_name}}",
  "{{start_date}}",
  "{{end_date}}",
  "{{value}}",
  "{{hourly_rate}}",
  "{{services_description}}",
  "{{payment_terms}}",
  "{{payment_method}}",
] as const;

export interface AgreementPlaceholderValues {
  clientName: string;
  clientAddress: string | null;
  orgName: string;
  contractName: string;
  startDate: string | null;
  endDate: string | null;
  value: number | null;
  hourlyRate: number | null;
  servicesDescription: string | null;
  paymentTerms: string | null;
  paymentMethod: string | null;
}

/**
 * Resolves {{placeholder}} tokens in a template/contract body against the
 * contract's (and client's) actual field values. Run at render time (PDF,
 * public signing page) rather than at save time, so it's always correct
 * even if fields are filled in after the template is applied.
 */
export function renderAgreementBody(body: string, values: AgreementPlaceholderValues): string {
  return body
    .replaceAll("{{client_name}}", values.clientName)
    .replaceAll("{{client_address}}", values.clientAddress ?? "TBD")
    .replaceAll("{{org_name}}", values.orgName)
    .replaceAll("{{contract_name}}", values.contractName)
    .replaceAll("{{start_date}}", values.startDate ?? "TBD")
    .replaceAll("{{end_date}}", values.endDate ?? "TBD")
    .replaceAll("{{value}}", values.value != null ? `$${values.value.toLocaleString()}` : "TBD")
    .replaceAll("{{hourly_rate}}", values.hourlyRate != null ? `$${values.hourlyRate.toLocaleString()}` : "TBD")
    .replaceAll("{{services_description}}", values.servicesDescription ?? "TBD")
    .replaceAll("{{payment_terms}}", values.paymentTerms ?? "TBD")
    .replaceAll("{{payment_method}}", values.paymentMethod ?? "TBD");
}
