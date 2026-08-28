import type { ConnectorAdapter, ExtractedRecord } from "../types";

function parseCsv(raw: string, delimiter = ","): ExtractedRecord[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const header = splitLine(lines[0]!, delimiter);
  return lines.slice(1).map((line) => {
    const cells = splitLine(line, delimiter);
    const record: ExtractedRecord = {};
    header.forEach((key, i) => {
      record[key.trim()] = cells[i]?.trim() ?? null;
    });
    return record;
  });
}

function splitLine(line: string, delimiter: string): string[] {
  // Minimal CSV split with quoted-field support — good enough for the
  // common "export from a spreadsheet" case this connector targets.
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export const csvAdapter: ConnectorAdapter = {
  async testConnection(config) {
    const raw = String(config.raw_csv ?? "");
    if (!raw.trim()) {
      return { ok: false, message: "Paste CSV content before testing the connection." };
    }
    const records = parseCsv(raw, String(config.delimiter ?? ","));
    if (records.length === 0) {
      return { ok: false, message: "Couldn't find any data rows below the header." };
    }
    return {
      ok: true,
      message: `Parsed ${records.length} row(s).`,
      fieldsDetected: Object.keys(records[0]!),
    };
  },

  async extract(config) {
    const records = parseCsv(String(config.raw_csv ?? ""), String(config.delimiter ?? ","));
    return { records };
  },
};
