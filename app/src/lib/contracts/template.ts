export const AGREEMENT_PLACEHOLDERS = [
  "{{client_name}}",
  "{{org_name}}",
  "{{contract_name}}",
  "{{start_date}}",
  "{{end_date}}",
  "{{value}}",
] as const;

export interface AgreementPlaceholderValues {
  clientName: string;
  orgName: string;
  contractName: string;
  startDate: string | null;
  endDate: string | null;
  value: number | null;
}

/**
 * Resolves {{placeholder}} tokens in a template/contract body against the
 * contract's actual field values. Run at render time (PDF, public signing
 * page) rather than at save time, so it's always correct even if dates or
 * value are filled in after the template is applied.
 */
export function renderAgreementBody(body: string, values: AgreementPlaceholderValues): string {
  return body
    .replaceAll("{{client_name}}", values.clientName)
    .replaceAll("{{org_name}}", values.orgName)
    .replaceAll("{{contract_name}}", values.contractName)
    .replaceAll("{{start_date}}", values.startDate ?? "TBD")
    .replaceAll("{{end_date}}", values.endDate ?? "TBD")
    .replaceAll("{{value}}", values.value != null ? `$${values.value.toLocaleString()}` : "TBD");
}
