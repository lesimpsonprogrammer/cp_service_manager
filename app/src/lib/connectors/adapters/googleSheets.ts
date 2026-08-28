import type { ConnectorAdapter } from "../types";

function buildCsvExportUrl(spreadsheetId: string, sheetName: string) {
  const url = new URL(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq`);
  url.searchParams.set("tqx", "out:csv");
  if (sheetName) url.searchParams.set("sheet", sheetName);
  return url.toString();
}

function parseCsv(raw: string) {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = lines[0]!.split(",").map((h) => h.replace(/^"|"$/g, "").trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
    const record: Record<string, unknown> = {};
    header.forEach((key, i) => (record[key] = cells[i] ?? null));
    return record;
  });
}

/**
 * Reads a Google Sheet published/shared as "Anyone with the link can view"
 * via its public CSV export endpoint — no OAuth or service account needed.
 * For private sheets, swap this adapter for one built on the Google Sheets
 * API with a service account (see README "Extending connectors").
 */
export const googleSheetsAdapter: ConnectorAdapter = {
  async testConnection(config) {
    const spreadsheetId = String(config.spreadsheet_id ?? "");
    if (!spreadsheetId) {
      return { ok: false, message: "Spreadsheet ID is required." };
    }
    try {
      const res = await fetch(buildCsvExportUrl(spreadsheetId, String(config.sheet_name ?? "")));
      if (!res.ok) {
        return {
          ok: false,
          message: `Google Sheets responded with ${res.status}. Make sure the sheet is shared as "Anyone with the link can view".`,
        };
      }
      const text = await res.text();
      const records = parseCsv(text);
      if (records.length === 0) {
        return { ok: false, message: "The sheet returned no data rows." };
      }
      return { ok: true, message: `Parsed ${records.length} row(s).`, fieldsDetected: Object.keys(records[0]!) };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Failed to reach Google Sheets." };
    }
  },

  async extract(config) {
    const spreadsheetId = String(config.spreadsheet_id ?? "");
    const res = await fetch(buildCsvExportUrl(spreadsheetId, String(config.sheet_name ?? "")));
    if (!res.ok) throw new Error(`Google Sheets responded with ${res.status}`);
    return { records: parseCsv(await res.text()) };
  },
};
