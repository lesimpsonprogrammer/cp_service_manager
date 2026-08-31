import type { ExtractedRecord } from "@/lib/connectors/types";

export type TransformOp =
  | "trim"
  | "uppercase"
  | "lowercase"
  | "default"
  | "drop_empty_rows"
  | "filter_equals";

export interface TransformStep {
  op: TransformOp;
  field?: string;
  value?: string;
}

export interface FieldMapping {
  source: string;
  target: string;
}

export function applyMapping(records: ExtractedRecord[], mapping: FieldMapping[]): ExtractedRecord[] {
  if (!mapping || mapping.length === 0) return records;

  return records.map((record) => {
    const mapped: ExtractedRecord = {};
    for (const { source, target } of mapping) {
      if (source in record) mapped[target?.trim() || source] = record[source];
    }
    return mapped;
  });
}

export function applyTransforms(records: ExtractedRecord[], steps: TransformStep[]): ExtractedRecord[] {
  let result = records;

  for (const step of steps ?? []) {
    switch (step.op) {
      case "trim":
        result = result.map((r) => mapField(r, step.field, (v) => (typeof v === "string" ? v.trim() : v)));
        break;
      case "uppercase":
        result = result.map((r) => mapField(r, step.field, (v) => (typeof v === "string" ? v.toUpperCase() : v)));
        break;
      case "lowercase":
        result = result.map((r) => mapField(r, step.field, (v) => (typeof v === "string" ? v.toLowerCase() : v)));
        break;
      case "default":
        result = result.map((r) => {
          if (!step.field) return r;
          const current = r[step.field];
          if (current !== undefined && current !== null && current !== "") return r;
          return { ...r, [step.field]: step.value ?? "" };
        });
        break;
      case "drop_empty_rows":
        result = result.filter((r) => Object.values(r).some((v) => v !== null && v !== undefined && v !== ""));
        break;
      case "filter_equals":
        if (step.field) {
          result = result.filter((r) => String(r[step.field!] ?? "") === (step.value ?? ""));
        }
        break;
    }
  }

  return result;
}

function mapField(
  record: ExtractedRecord,
  field: string | undefined,
  fn: (value: unknown) => unknown
): ExtractedRecord {
  if (!field || !(field in record)) return record;
  return { ...record, [field]: fn(record[field]) };
}
