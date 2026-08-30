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

export type ConnectorCategory = "Spreadsheet" | "HCM" | "ERP" | "Database" | "API" | "Tax Filing";

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

export interface UnloadResult {
  deleted: number;
  failed: number;
  error?: string;
}

export interface ConnectorAdapter {
  testConnection(config: Record<string, unknown>): Promise<ConnectionTestResult>;
  extract(config: Record<string, unknown>): Promise<ExtractResult>;
  /** Only implemented by adapters that can act as a pipeline destination. */
  load?(config: Record<string, unknown>, records: ExtractedRecord[]): Promise<LoadResult>;
  /**
   * Best-effort undo of a previous `load`: given the same records that were
   * sent, remove them from the destination again. Matches by value rather
   * than a tracked row id (the destination table isn't required to have
   * one), so it can miss or over-delete when the destination has duplicate
   * rows identical to a loaded record — surfaced in the UI as a caveat, not
   * hidden. Only implemented by adapters whose destination supports it.
   */
  unload?(config: Record<string, unknown>, records: ExtractedRecord[]): Promise<UnloadResult>;
}
