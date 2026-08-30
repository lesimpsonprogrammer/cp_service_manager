import type { ExtractedRecord } from "@/lib/connectors/types";

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "string" ? value : JSON.stringify(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function recordsToCsv(records: ExtractedRecord[]): string {
  if (records.length === 0) return "";

  const columns = Array.from(records.reduce((set, r) => {
    Object.keys(r).forEach((k) => set.add(k));
    return set;
  }, new Set<string>()));

  const rows = records.map((r) => columns.map((c) => escapeCell(r[c])).join(","));
  return [columns.join(","), ...rows].join("\r\n");
}
