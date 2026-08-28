import type { DataSourceType } from "@/types/database";

export type ConnectorFieldType = "text" | "password" | "url" | "number" | "select" | "textarea";

export interface ConnectorFieldOption {
  label: string;
  value: string;
}

export interface ConnectorField {
  key: string;
  label: string;
  type: ConnectorFieldType;
  placeholder?: string;
  required?: boolean;
  options?: ConnectorFieldOption[];
  /** Secret values are still stored in `config` in this scaffold (see README
   * "Secrets" section) but are masked in the UI and excluded from API
   * responses that echo config back to the client. */
  secret?: boolean;
  helpText?: string;
  defaultValue?: string;
}

export type ConnectorCategory = "Spreadsheet" | "HCM" | "ERP" | "Database" | "API";

export interface ConnectorDefinition {
  type: DataSourceType;
  category: ConnectorCategory;
  label: string;
  description: string;
  icon: string;
  fields: ConnectorField[];
}

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
  fieldsDetected?: string[];
}

export type ExtractedRecord = Record<string, unknown>;

export interface ExtractResult {
  records: ExtractedRecord[];
  truncated?: boolean;
}

export interface LoadResult {
  loaded: number;
  failed: number;
  error?: string;
}

export interface ConnectorAdapter {
  testConnection(config: Record<string, unknown>): Promise<ConnectionTestResult>;
  extract(config: Record<string, unknown>): Promise<ExtractResult>;
  /** Only implemented by adapters that can act as a pipeline destination. */
  load?(config: Record<string, unknown>, records: ExtractedRecord[]): Promise<LoadResult>;
}
