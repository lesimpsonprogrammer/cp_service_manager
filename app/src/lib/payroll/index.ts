import { checkPayrollClient } from "./providers/check";
import type { PayrollProviderClient } from "./types";

export * from "./types";

export function getPayrollProviderClient(provider: string): PayrollProviderClient {
  switch (provider) {
    case "check":
      return checkPayrollClient;
    default:
      throw new Error(`Unknown payroll provider: ${provider}`);
  }
}
