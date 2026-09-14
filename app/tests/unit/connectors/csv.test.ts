import { describe, expect, it } from "vitest";
import { csvAdapter } from "@/lib/connectors/adapters/csv";

describe("csvAdapter", () => {
  it("rejects an empty testConnection", async () => {
    const result = await csvAdapter.testConnection({ raw_csv: "" });
    expect(result.ok).toBe(false);
  });

  it("parses header + rows and detects fields", async () => {
    const raw = "id,name\n1,Jordan\n2,Alex";
    const result = await csvAdapter.testConnection({ raw_csv: raw });
    expect(result.ok).toBe(true);
    expect(result.fieldsDetected).toEqual(["id", "name"]);
  });

  it("supports a custom delimiter and quoted fields", async () => {
    const raw = 'id;name\n1;"Smith, Jordan"';
    const { records } = await csvAdapter.extract({ raw_csv: raw, delimiter: ";" });
    expect(records).toEqual([{ id: "1", name: "Smith, Jordan" }]);
  });

  it("reports no data rows when only a header is present", async () => {
    const result = await csvAdapter.testConnection({ raw_csv: "id,name" });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/data rows/i);
  });
});
