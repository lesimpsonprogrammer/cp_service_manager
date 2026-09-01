import * as cheerio from "cheerio";
import ExcelJS from "exceljs";
import { PDFParse } from "pdf-parse";
import type { ConnectorAdapter, ExtractedRecord } from "../types";

const MAX_FETCH_BYTES = 25 * 1024 * 1024; // 25MB — enough for a real report, small enough to stay in memory safely.

type Format = "auto" | "html" | "pdf" | "excel";

async function fetchAsBuffer(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Fetching ${url} failed: ${res.status} ${res.statusText}`);
  }
  const contentLength = res.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_FETCH_BYTES) {
    throw new Error(`File is too large (${contentLength} bytes) — the 25MB limit keeps this connector from loading huge files into memory.`);
  }
  const arrayBuffer = await res.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_FETCH_BYTES) {
    throw new Error("File is too large — the 25MB limit keeps this connector from loading huge files into memory.");
  }
  return { buffer: Buffer.from(arrayBuffer), contentType: res.headers.get("content-type") ?? "" };
}

function detectFormat(url: string, contentType: string, configured: Format): Exclude<Format, "auto"> {
  if (configured !== "auto") return configured;
  const lower = url.toLowerCase().split("?")[0] ?? "";
  if (lower.endsWith(".pdf") || contentType.includes("application/pdf")) return "pdf";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || contentType.includes("spreadsheetml") || contentType.includes("ms-excel")) return "excel";
  return "html";
}

function extractHtmlTable(html: string, tableIndex: number): ExtractedRecord[] {
  const $ = cheerio.load(html);
  const table = $("table").eq(tableIndex);
  if (table.length === 0) {
    throw new Error(`No <table> found at index ${tableIndex} on this page.`);
  }

  const rows = table.find("tr").toArray();
  if (rows.length === 0) return [];

  const headerCells = $(rows[0]).find("th,td").toArray();
  const headers = headerCells.map((cell, i) => {
    const text = $(cell).text().trim();
    return text || `column_${i + 1}`;
  });

  const records: ExtractedRecord[] = [];
  for (const row of rows.slice(1)) {
    const cells = $(row).find("td,th").toArray();
    if (cells.length === 0) continue;
    const record: ExtractedRecord = {};
    headers.forEach((header, i) => {
      record[header] = cells[i] ? $(cells[i]).text().trim() : null;
    });
    records.push(record);
  }
  return records;
}

async function extractPdfText(buffer: Buffer): Promise<ExtractedRecord[]> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const lines = result.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    return lines.map((text, i) => ({ line_number: i + 1, text }));
  } finally {
    await parser.destroy();
  }
}

async function extractExcel(buffer: Buffer, sheetName: string): Promise<ExtractedRecord[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheet = (sheetName ? workbook.getWorksheet(sheetName) : undefined) ?? workbook.worksheets[0];
  if (!sheet) throw new Error(sheetName ? `No sheet named "${sheetName}" found.` : "Workbook has no sheets.");

  const rows = sheet.getRows(1, sheet.rowCount) ?? [];
  if (rows.length === 0) return [];

  const headerRow = rows[0]!;
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value ?? `column_${colNumber}`).trim() || `column_${colNumber}`;
  });

  const records: ExtractedRecord[] = [];
  for (const row of rows.slice(1)) {
    if (!row.hasValues) continue;
    const record: ExtractedRecord = {};
    headers.forEach((header, i) => {
      const cell = row.getCell(i + 1);
      record[header] = cell.value ?? null;
    });
    records.push(record);
  }
  return records;
}

export const webScraperAdapter: ConnectorAdapter = {
  async testConnection(config) {
    const url = String(config.url ?? "");
    if (!url) return { ok: false, message: "Enter a URL first." };
    try {
      const res = await fetch(url, { method: "GET", redirect: "follow" });
      if (!res.ok) {
        return { ok: false, message: `${res.status} ${res.statusText}` };
      }
      const format = detectFormat(url, res.headers.get("content-type") ?? "", (String(config.format ?? "auto") as Format));
      return { ok: true, message: `Reachable — detected as ${format}.` };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Could not reach that URL." };
    }
  },

  async extract(config) {
    const url = String(config.url ?? "");
    if (!url) throw new Error("Set a URL for this data source first.");

    const { buffer, contentType } = await fetchAsBuffer(url);
    const format = detectFormat(url, contentType, String(config.format ?? "auto") as Format);

    switch (format) {
      case "pdf":
        return { records: await extractPdfText(buffer) };
      case "excel":
        return { records: await extractExcel(buffer, String(config.sheet_name ?? "").trim()) };
      case "html": {
        const tableIndex = Number(config.table_index ?? 0) || 0;
        return { records: extractHtmlTable(buffer.toString("utf-8"), tableIndex) };
      }
    }
  },
};
