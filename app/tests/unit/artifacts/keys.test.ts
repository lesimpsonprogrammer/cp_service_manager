import { describe, expect, it } from "vitest";
import {
  buildStoragePath,
  fileNameFromKey,
  formatBytes,
  groupByFolder,
  normalizeArtifactKey,
  normalizeArtifactPrefix,
  normalizeBucketName,
  parseTags,
  sanitizeSearch,
} from "@/lib/artifacts/keys";

describe("normalizeBucketName", () => {
  it("accepts S3-style names and normalizes case/spaces", () => {
    expect(normalizeBucketName("payroll")).toEqual({ ok: true, value: "payroll" });
    expect(normalizeBucketName("  Benefits Enrollment ")).toEqual({ ok: true, value: "benefits-enrollment" });
    expect(normalizeBucketName("year_end_2026")).toEqual({ ok: true, value: "year-end-2026" });
  });

  it("rejects names that are too short, too long, or badly formed", () => {
    expect(normalizeBucketName("ab").ok).toBe(false);
    expect(normalizeBucketName("a".repeat(64)).ok).toBe(false);
    expect(normalizeBucketName("-leading").ok).toBe(false);
    expect(normalizeBucketName("trailing-").ok).toBe(false);
    expect(normalizeBucketName("double--hyphen").ok).toBe(false);
    expect(normalizeBucketName("dots.not.allowed").ok).toBe(false);
  });
});

describe("normalizeArtifactKey", () => {
  it("cleans up slashes", () => {
    expect(normalizeArtifactKey(" /acme//2026\\q3 register.xlsx/ ")).toEqual({
      ok: true,
      value: "acme/2026/q3 register.xlsx",
    });
  });

  it("rejects empty keys and traversal segments", () => {
    expect(normalizeArtifactKey("   ").ok).toBe(false);
    expect(normalizeArtifactKey("acme/../secrets.csv").ok).toBe(false);
    expect(normalizeArtifactKey("./file.csv").ok).toBe(false);
  });

  it("rejects segments with leading/trailing spaces or odd characters", () => {
    expect(normalizeArtifactKey("acme/ padded /file.csv").ok).toBe(false);
    expect(normalizeArtifactKey("acme/file?.csv").ok).toBe(false);
    expect(normalizeArtifactKey("acme/<script>.csv").ok).toBe(false);
  });

  it("rejects keys over 512 characters", () => {
    expect(normalizeArtifactKey("a".repeat(513)).ok).toBe(false);
    expect(normalizeArtifactKey("a".repeat(512)).ok).toBe(true);
  });
});

describe("normalizeArtifactPrefix", () => {
  it("returns a folder prefix with a trailing slash, or empty", () => {
    expect(normalizeArtifactPrefix("acme/2026")).toBe("acme/2026/");
    expect(normalizeArtifactPrefix("/acme/")).toBe("acme/");
    expect(normalizeArtifactPrefix("")).toBe("");
    expect(normalizeArtifactPrefix("../etc")).toBe("");
  });
});

describe("fileNameFromKey / buildStoragePath", () => {
  it("takes the last key segment as the file name", () => {
    expect(fileNameFromKey("acme/2026/register.xlsx")).toBe("register.xlsx");
    expect(fileNameFromKey("register.xlsx")).toBe("register.xlsx");
  });

  it("builds a storage path keyed by org and artifact id with a safe file name", () => {
    expect(buildStoragePath("org-1", "art-1", "Q3 Register (final).xlsx")).toBe("org-1/art-1/Q3_Register_final_.xlsx");
    expect(buildStoragePath("org-1", "art-1", "???")).toBe("org-1/art-1/file");
  });
});

describe("parseTags", () => {
  it("splits, lowercases, hyphenates, and de-duplicates", () => {
    expect(parseTags("Year End, q3 ,Q3, signed!")).toEqual(["year-end", "q3", "signed"]);
    expect(parseTags(["W-2", "w-2", ""])).toEqual(["w-2"]);
    expect(parseTags(null)).toEqual([]);
  });

  it("caps at 20 tags", () => {
    expect(parseTags(Array.from({ length: 30 }, (_, i) => `t${i}`))).toHaveLength(20);
  });
});

describe("formatBytes", () => {
  it("formats human-readable sizes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(50 * 1024 * 1024)).toBe("50 MB");
    expect(formatBytes(-1)).toBe("—");
  });
});

describe("groupByFolder", () => {
  const items = [
    { key: "acme/2026/a.csv" },
    { key: "acme/2026/b.csv" },
    { key: "acme/readme.md" },
    { key: "globex/x.csv" },
    { key: "root.txt" },
  ];

  it("groups the bucket root into folders and files", () => {
    const { folders, files } = groupByFolder(items, "");
    expect(folders).toEqual([
      { name: "acme", prefix: "acme/", count: 3 },
      { name: "globex", prefix: "globex/", count: 1 },
    ]);
    expect(files.map((f) => f.key)).toEqual(["root.txt"]);
  });

  it("groups within a prefix", () => {
    const { folders, files } = groupByFolder(items, "acme/");
    expect(folders).toEqual([{ name: "2026", prefix: "acme/2026/", count: 2 }]);
    expect(files.map((f) => f.key)).toEqual(["acme/readme.md"]);
  });
});

describe("sanitizeSearch", () => {
  it("strips PostgREST filter delimiters and wildcards", () => {
    expect(sanitizeSearch("register,key.eq.x)")).toBe("register key.eq.x");
    expect(sanitizeSearch("  100%*  ")).toBe("100");
    expect(sanitizeSearch(undefined)).toBe("");
  });
});
