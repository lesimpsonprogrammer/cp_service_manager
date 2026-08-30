import type {
  CreateCompanyInput,
  CreateCompanyResult,
  CreateEmployeeInput,
  CreateEmployeeResult,
  PayrollProviderClient,
  SubmitPayRunInput,
  SubmitPayRunResult,
} from "../types";

/**
 * SCAFFOLD — not wired up to a live account.
 *
 * Check (checkhq.com) is a partner API: onboarding requires an approved
 * partner agreement before any of these endpoints are reachable, so the
 * request shapes below are a best-effort sketch, not verified against
 * live docs from this environment. Before using this for real:
 *   1. Get partner-approved and pull the current API reference from
 *      Check's own docs (endpoint paths/fields do change between their
 *      sandbox and GA API versions).
 *   2. Replace the placeholder request/response shapes here to match.
 *   3. Set CHECK_API_KEY (and CHECK_API_BASE_URL for sandbox vs prod).
 */
const BASE_URL = process.env.CHECK_API_BASE_URL ?? "https://api.checkhq.com";

function headers(): HeadersInit {
  const apiKey = process.env.CHECK_API_KEY;
  if (!apiKey) throw new Error("CHECK_API_KEY is not configured.");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export const checkPayrollClient: PayrollProviderClient = {
  async createCompany(input: CreateCompanyInput): Promise<CreateCompanyResult> {
    const res = await fetch(`${BASE_URL}/companies`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ legal_name: input.legalName, ein: input.ein }),
    });
    if (!res.ok) throw new Error(`Check createCompany failed with status ${res.status}`);
    const body = (await res.json()) as { id: string; onboard: { url: string } };
    return { providerCompanyId: body.id, onboardingUrl: body.onboard.url };
  },

  async createEmployee(input: CreateEmployeeInput): Promise<CreateEmployeeResult> {
    const res = await fetch(`${BASE_URL}/employees`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        company: input.providerCompanyId,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
      }),
    });
    if (!res.ok) throw new Error(`Check createEmployee failed with status ${res.status}`);
    const body = (await res.json()) as { id: string; onboard: { url: string } };
    return { providerEmployeeId: body.id, onboardingUrl: body.onboard.url };
  },

  async submitPayRun(input: SubmitPayRunInput): Promise<SubmitPayRunResult> {
    const res = await fetch(`${BASE_URL}/payrolls`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        company: input.providerCompanyId,
        period_start: input.payPeriodStart,
        period_end: input.payPeriodEnd,
        payday: input.payDate,
      }),
    });
    if (!res.ok) throw new Error(`Check submitPayRun failed with status ${res.status}`);
    const body = (await res.json()) as { id: string; status: string };
    return { providerPayRunId: body.id, status: body.status };
  },
};
