import type { ConnectorAdapter, ExtractedRecord } from "../types";

function buildHeaders(config: Record<string, unknown>): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  const authType = String(config.auth_type ?? "none");

  if (authType === "bearer" && config.api_key) {
    headers.Authorization = `Bearer ${config.api_key}`;
  } else if (authType === "api_key" && config.api_key) {
    headers[String(config.auth_header || "X-API-Key")] = String(config.api_key);
  } else if (authType === "basic" && config.basic_username) {
    const token = Buffer.from(`${config.basic_username}:${config.basic_password ?? ""}`).toString("base64");
    headers.Authorization = `Basic ${token}`;
  }

  return headers;
}

function buildUrl(config: Record<string, unknown>): string {
  const base = String(config.base_url ?? "").replace(/\/$/, "");
  const endpoint = String(config.endpoint ?? "");
  return endpoint ? `${base}${endpoint.startsWith("/") ? "" : "/"}${endpoint}` : base;
}

function extractRecordsFromBody(body: unknown, recordsPath?: string): ExtractedRecord[] {
  let node: unknown = body;

  if (recordsPath) {
    for (const key of recordsPath.split(".").map((k) => k.trim()).filter(Boolean)) {
      if (node && typeof node === "object" && key in (node as Record<string, unknown>)) {
        node = (node as Record<string, unknown>)[key];
      } else {
        return [];
      }
    }
  }

  if (Array.isArray(node)) return node as ExtractedRecord[];
  if (node && typeof node === "object") return [node as ExtractedRecord];
  return [];
}

export const restApiAdapter: ConnectorAdapter = {
  async testConnection(config) {
    if (!config.base_url) {
      return { ok: false, message: "Base URL is required." };
    }
    try {
      const res = await fetch(buildUrl(config), { headers: buildHeaders(config) });
      if (!res.ok) {
        return { ok: false, message: `Request failed with status ${res.status}.` };
      }
      const body = await res.json().catch(() => null);
      const records = extractRecordsFromBody(body, String(config.records_path ?? ""));
      return {
        ok: true,
        message: `Connected. Found ${records.length} record(s) at the configured path.`,
        fieldsDetected: records[0] ? Object.keys(records[0]) : undefined,
      };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Request failed." };
    }
  },

  async extract(config) {
    const res = await fetch(buildUrl(config), { headers: buildHeaders(config) });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    const body = await res.json();
    return { records: extractRecordsFromBody(body, String(config.records_path ?? "")) };
  },
};
