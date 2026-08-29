export interface ComplianceFramework {
  code: string;
  label: string;
}

// The major comprehensive state consumer-privacy laws in effect. Not
// exhaustive of every data-related state law (e.g. breach-notification
// statutes exist in all 50 states) — this list is the flaggable set for
// client configuration and contract disclosure, not a compliance engine.
export const COMPLIANCE_FRAMEWORKS: ComplianceFramework[] = [
  { code: "CCPA_CPRA", label: "California (CCPA/CPRA)" },
  { code: "VCDPA", label: "Virginia (VCDPA)" },
  { code: "CPA_CO", label: "Colorado (CPA)" },
  { code: "CTDPA", label: "Connecticut (CTDPA)" },
  { code: "UCPA", label: "Utah (UCPA)" },
  { code: "ICDPA", label: "Iowa (ICDPA)" },
  { code: "TDPSA", label: "Texas (TDPSA)" },
  { code: "OCPA", label: "Oregon (OCPA)" },
];

export function frameworkLabel(code: string): string {
  return COMPLIANCE_FRAMEWORKS.find((f) => f.code === code)?.label ?? code;
}
