// Pure helpers for Artifact Management — no Supabase imports, so they're safe
// to use from Client Components and easy to unit test.

/** Private Supabase Storage bucket that holds every artifact's bytes. */
export const ARTIFACTS_STORAGE_BUCKET = "artifacts";

export const MAX_ARTIFACT_KEY_LENGTH = 512;

/** Expiry choices for shareable download links (seconds). */
export const SHARE_LINK_TTLS = [
  { seconds: 60 * 60, label: "1 hour" },
  { seconds: 60 * 60 * 24, label: "24 hours" },
  { seconds: 60 * 60 * 24 * 7, label: "7 days" },
] as const;

export const DEFAULT_DOWNLOAD_TTL_SECONDS = 60;

const BUCKET_NAME_RE = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
// Printable, path-safe characters. Spaces are allowed inside a segment.
const KEY_SEGMENT_RE = /^[A-Za-z0-9 ._()+=,@&'!-]+$/;

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** S3-style bucket names: 3–63 chars, lowercase letters, digits, hyphens. */
export function normalizeBucketName(input: string): Result<string> {
  const name = input.trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (!BUCKET_NAME_RE.test(name)) {
    return {
      ok: false,
      error:
        "Bucket names are 3–63 characters: lowercase letters, numbers, and hyphens, starting and ending with a letter or number.",
    };
  }
  if (name.includes("--")) return { ok: false, error: "Bucket names can't contain consecutive hyphens." };
  return { ok: true, value: name };
}

/**
 * Normalizes an object key like `acme/2026/q3-register.xlsx`: trims, turns
 * backslashes into slashes, collapses repeated slashes, and strips leading /
 * trailing slashes. Rejects `.`/`..` segments and characters outside a
 * conservative, URL-friendly set.
 */
export function normalizeArtifactKey(input: string): Result<string> {
  const key = input
    .trim()
    .replace(/\\/g, "/")
    .replace(/\/{2,}/g, "/")
    .replace(/^\/+|\/+$/g, "");

  if (!key) return { ok: false, error: "Give this artifact a key (path), e.g. acme/2026/register.xlsx." };
  if (key.length > MAX_ARTIFACT_KEY_LENGTH) {
    return { ok: false, error: `Keys can be at most ${MAX_ARTIFACT_KEY_LENGTH} characters.` };
  }

  for (const segment of key.split("/")) {
    const trimmed = segment.trim();
    if (trimmed === "." || trimmed === "..") return { ok: false, error: "Keys can't contain '.' or '..' segments." };
    if (!trimmed || trimmed !== segment) {
      return { ok: false, error: "Key segments can't be empty or start/end with a space." };
    }
    if (!KEY_SEGMENT_RE.test(segment)) {
      return {
        ok: false,
        error: `"${segment}" has unsupported characters. Use letters, numbers, spaces, and . _ - ( ) + = , @ & ' !`,
      };
    }
  }

  return { ok: true, value: key };
}

/** Normalizes a prefix filter (folder) — same rules as a key, trailing slash kept. */
export function normalizeArtifactPrefix(input: string): string {
  const result = normalizeArtifactKey(input);
  return result.ok ? `${result.value}/` : "";
}

/** The last segment of a key — what a downloaded file is named. */
export function fileNameFromKey(key: string): string {
  const parts = key.split("/");
  return parts[parts.length - 1] || key;
}

/**
 * Where an artifact version's bytes live inside the private storage bucket.
 * Keyed by artifact id (not the user-facing key) so renames, odd characters,
 * and versions never collide.
 */
export function buildStoragePath(orgId: string, artifactId: string, fileName: string): string {
  const safeName = fileName.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "file";
  return `${orgId}/${artifactId}/${safeName}`;
}

/** Comma/space separated tags → unique, lowercase, hyphenated tags (max 20). */
export function parseTags(input: string | string[] | null | undefined): string[] {
  const raw = Array.isArray(input) ? input : (input ?? "").split(",");
  const tags = new Set<string>();
  for (const value of raw) {
    const tag = String(value)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9:_-]/g, "")
      .slice(0, 40);
    if (tag) tags.add(tag);
    if (tags.size >= 20) break;
  }
  return [...tags];
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
}

/** Groups latest-version keys under a prefix into folders and files, S3-console style. */
export function groupByFolder<T extends { key: string }>(
  items: T[],
  prefix: string
): { folders: { name: string; prefix: string; count: number }[]; files: T[] } {
  const folders = new Map<string, number>();
  const files: T[] = [];
  for (const item of items) {
    if (!item.key.startsWith(prefix)) continue;
    const rest = item.key.slice(prefix.length);
    const slash = rest.indexOf("/");
    if (slash === -1) {
      files.push(item);
    } else {
      const folder = rest.slice(0, slash);
      folders.set(folder, (folders.get(folder) ?? 0) + 1);
    }
  }
  return {
    folders: [...folders.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, prefix: `${prefix}${name}/`, count })),
    files: files.sort((a, b) => a.key.localeCompare(b.key)),
  };
}

/**
 * Makes free-text search safe to drop into a PostgREST `or()` filter — strips
 * the characters that delimit filters (`,` `(` `)`) or act as wildcards.
 */
export function sanitizeSearch(input: string | null | undefined): string {
  return (input ?? "")
    .replace(/[,()*%{}"\\:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}
