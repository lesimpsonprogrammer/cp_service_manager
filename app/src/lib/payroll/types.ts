export interface CreateCompanyInput {
  legalName: string;
  ein: string;
}

export interface CreateCompanyResult {
  providerCompanyId: string;
  onboardingUrl: string;
}

export interface CreateEmployeeInput {
  providerCompanyId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface CreateEmployeeResult {
  providerEmployeeId: string;
  onboardingUrl: string;
}

export interface SubmitPayRunInput {
  providerCompanyId: string;
  payPeriodStart: string; // ISO date
  payPeriodEnd: string; // ISO date
  payDate: string; // ISO date
}

export interface SubmitPayRunResult {
  providerPayRunId: string;
  status: string;
}

/**
 * Thin interface over whichever embedded-payroll provider we're partnered
 * with (Check, Gusto Embedded, etc). The provider is the source of truth
 * for tax withholding, filings, and money movement — this client only
 * drives their API and relays results; it does no payroll math itself.
 */
export interface PayrollProviderClient {
  createCompany(input: CreateCompanyInput): Promise<CreateCompanyResult>;
  createEmployee(input: CreateEmployeeInput): Promise<CreateEmployeeResult>;
  submitPayRun(input: SubmitPayRunInput): Promise<SubmitPayRunResult>;
}
