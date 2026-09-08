import type { ExtractedRecord } from "@/lib/connectors/types";

// Bounded so profiling a large extract stays cheap and never becomes the
// sample-data channel — same discipline as SAMPLE_LIMIT in the run engine.
const PROFILE_SAMPLE_LIMIT = 25;

export type FieldValueType = "empty" | "boolean" | "integer" | "decimal" | "date" | "email" | "text";

export interface FieldProfile {
  field: string;
  type: FieldValueType;
  nullRate: number;
  uniqueRatio: number;
  sampleValues: string[];
}

export interface MappingSuggestion {
  source: string;
  target: string;
  confidence: number;
  evidence: string;
}

export interface SuggestMappingResult {
  suggestions: MappingSuggestion[];
  sourceFields: FieldProfile[];
  destinationFields: FieldProfile[] | null;
  sampleSize: number;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?)?$|^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
const INTEGER_RE = /^-?\d+$/;
const DECIMAL_RE = /^-?\d*\.\d+$/;
const BOOLEAN_VALUES = new Set(["true", "false", "yes", "no", "y", "n", "0", "1"]);

function classifyValue(raw: unknown): FieldValueType {
  if (raw === null || raw === undefined || raw === "") return "empty";
  const value = String(raw).trim();
  if (value === "") return "empty";
  if (BOOLEAN_VALUES.has(value.toLowerCase()) && value.length <= 5) return "boolean";
  if (INTEGER_RE.test(value)) return "integer";
  if (DECIMAL_RE.test(value)) return "decimal";
  if (EMAIL_RE.test(value)) return "email";
  if (DATE_RE.test(value)) return "date";
  return "text";
}

/** Profiles every field across a sample of extracted records: inferred type, null rate, and cardinality. */
export function profileFields(records: ExtractedRecord[]): FieldProfile[] {
  const sample = records.slice(0, PROFILE_SAMPLE_LIMIT);
  const fieldNames = new Set<string>();
  for (const record of sample) {
    for (const key of Object.keys(record)) fieldNames.add(key);
  }

  return Array.from(fieldNames).map((field) => {
    const values = sample.map((r) => r[field]);
    const typeCounts = new Map<FieldValueType, number>();
    const nonEmpty: string[] = [];

    for (const value of values) {
      const type = classifyValue(value);
      typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
      if (type !== "empty") nonEmpty.push(String(value));
    }

    const nullCount = typeCounts.get("empty") ?? 0;
    let dominantType: FieldValueType = "empty";
    let dominantCount = -1;
    for (const [type, count] of typeCounts) {
      if (type === "empty") continue;
      if (count > dominantCount) {
        dominantType = type;
        dominantCount = count;
      }
    }
    if (dominantCount === -1) dominantType = "empty";

    const uniqueValues = new Set(nonEmpty);

    return {
      field,
      type: dominantType,
      nullRate: sample.length === 0 ? 0 : nullCount / sample.length,
      uniqueRatio: nonEmpty.length === 0 ? 0 : uniqueValues.size / nonEmpty.length,
      sampleValues: Array.from(uniqueValues).slice(0, 3),
    };
  });
}

function normalizeTokens(name: string): string[] {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Token-set similarity between two field names — order-independent, tolerant of case/delimiter differences. */
function lexicalScore(a: string, b: string): number {
  const tokensA = new Set(normalizeTokens(a));
  const tokensB = new Set(normalizeTokens(b));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let shared = 0;
  for (const token of tokensA) if (tokensB.has(token)) shared++;

  const union = new Set([...tokensA, ...tokensB]).size;
  const jaccard = shared / union;

  // Substring containment catches abbreviation-style matches (e.g. "st" vs
  // "state") that token overlap alone misses, at a lower weight than an
  // actual shared token so it never outscores a real match.
  const joinedA = tokensA.size ? Array.from(tokensA).join("") : "";
  const joinedB = tokensB.size ? Array.from(tokensB).join("") : "";
  const containment =
    joinedA.length >= 2 && joinedB.length >= 2 && (joinedA.includes(joinedB) || joinedB.includes(joinedA)) ? 0.3 : 0;

  return Math.max(jaccard, containment);
}

/** Value-profile similarity: do two fields' inferred types and shapes actually line up. */
function valueScore(a: FieldProfile, b: FieldProfile): number {
  if (a.type === "empty" || b.type === "empty") return 0.3;
  if (a.type !== b.type) return 0;

  // Same type: reward similar cardinality shape (both mostly-unique like an
  // id, or both low-cardinality like a status/category field).
  const cardinalityDelta = Math.abs(a.uniqueRatio - b.uniqueRatio);
  return 0.6 + 0.4 * (1 - cardinalityDelta);
}

function toSnakeCase(name: string): string {
  const tokens = normalizeTokens(name);
  return tokens.length ? tokens.join("_") : name;
}

/**
 * Suggests source → target field mappings from sampled records only —
 * lexical name similarity plus value-shape profiling, no external calls.
 * When `destinationRecords` isn't supplied, suggestions fall back to a
 * cleaned-up (snake_case) version of the source field name.
 */
export function suggestMapping(
  sourceRecords: ExtractedRecord[],
  destinationRecords: ExtractedRecord[] | null
): SuggestMappingResult {
  const sourceFields = profileFields(sourceRecords);
  const destinationFields = destinationRecords ? profileFields(destinationRecords) : null;

  const suggestions: MappingSuggestion[] = sourceFields.map((source) => {
    if (!destinationFields || destinationFields.length === 0) {
      const target = toSnakeCase(source.field);
      return {
        source: source.field,
        target,
        confidence: target === source.field ? 0.6 : 0.75,
        evidence: "No destination sample available — suggested a cleaned-up field name.",
      };
    }

    let best: { target: FieldProfile; score: number; lex: number; val: number } | null = null;
    for (const target of destinationFields) {
      const lex = lexicalScore(source.field, target.field);
      const val = valueScore(source, target);
      const score = 0.65 * lex + 0.35 * val;
      if (!best || score > best.score) best = { target, score, lex, val };
    }

    if (!best || best.score < 0.2) {
      const target = toSnakeCase(source.field);
      return {
        source: source.field,
        target,
        confidence: 0.3,
        evidence: "No destination field scored high enough — left as a cleaned-up name for review.",
      };
    }

    return {
      source: source.field,
      target: best.target.field,
      confidence: Math.round(best.score * 100) / 100,
      evidence: `Name match ${Math.round(best.lex * 100)}%, value shape match ${Math.round(best.val * 100)}% (${source.type}).`,
    };
  });

  return {
    suggestions,
    sourceFields,
    destinationFields,
    sampleSize: Math.min(sourceRecords.length, PROFILE_SAMPLE_LIMIT),
  };
}
