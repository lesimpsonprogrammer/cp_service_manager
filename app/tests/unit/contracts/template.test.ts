import { describe, expect, it } from "vitest";
import { renderAgreementBody, type AgreementPlaceholderValues } from "@/lib/contracts/template";

const values: AgreementPlaceholderValues = {
  clientName: "Acme Co",
  clientAddress: null,
  orgName: "Momentum",
  contractName: "MSA",
  startDate: "2026-01-01",
  endDate: null,
  value: 12000,
  hourlyRate: null,
  servicesDescription: "Data extraction",
  paymentTerms: null,
  paymentMethod: null,
};

describe("renderAgreementBody", () => {
  it("substitutes known placeholders", () => {
    const out = renderAgreementBody("{{client_name}} agrees to pay {{org_name}} {{value}}.", values);
    expect(out).toBe("Acme Co agrees to pay Momentum $12,000.");
  });

  it("falls back to TBD for unset optional fields", () => {
    const out = renderAgreementBody("Ends {{end_date}}, rate {{hourly_rate}}.", values);
    expect(out).toBe("Ends TBD, rate TBD.");
  });

  it("replaces every occurrence of a repeated placeholder", () => {
    const out = renderAgreementBody("{{client_name}} / {{client_name}}", values);
    expect(out).toBe("Acme Co / Acme Co");
  });
});
