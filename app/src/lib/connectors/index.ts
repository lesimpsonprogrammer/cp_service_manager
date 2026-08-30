import type { DataSourceType } from "@/types/database";
import type { ConnectorAdapter } from "./types";
import { csvAdapter } from "./adapters/csv";
import { googleSheetsAdapter } from "./adapters/googleSheets";
import { restApiAdapter } from "./adapters/restApi";
import { postgresAdapter } from "./adapters/postgres";
import { taxBanditsAdapter } from "./adapters/taxBandits";
import { adpWorkforceNowAdapter } from "./adapters/adpWorkforceNow";
import { paychexFlexAdapter } from "./adapters/paychexFlex";

export * from "./types";
export { CONNECTOR_DEFINITIONS, getConnectorDefinition } from "./registry";

// HCM and ERP systems are onboarded as REST APIs configured with a
// vendor-specific base URL / endpoint / token (see registry.ts fields).
// Swap in a dedicated adapter here for a vendor that needs OAuth or a
// custom SDK (e.g. Workday RaaS, NetSuite SuiteTalk) without touching
// callers — they only ever go through `getConnectorAdapter`.
const ADAPTERS: Record<DataSourceType, ConnectorAdapter | null> = {
  spreadsheet: csvAdapter,
  google_sheets: googleSheetsAdapter,
  rest_api: restApiAdapter,
  sql_database: postgresAdapter,
  hcm: restApiAdapter,
  erp: restApiAdapter,
  tax_filing: taxBanditsAdapter,
  adp_workforce_now: adpWorkforceNowAdapter,
  paychex_flex: paychexFlexAdapter,
  webhook: null,
};

export function getConnectorAdapter(type: DataSourceType): ConnectorAdapter | null {
  return ADAPTERS[type] ?? null;
}
