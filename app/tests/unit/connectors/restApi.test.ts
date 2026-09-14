import { afterEach, describe, expect, it, vi } from "vitest";
import { restApiAdapter } from "@/lib/connectors/adapters/restApi";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

describe("restApiAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requires a base URL", async () => {
    const result = await restApiAdapter.testConnection({});
    expect(result.ok).toBe(false);
  });

  it("extracts a top-level array response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ id: 1 }, { id: 2 }]));
    vi.stubGlobal("fetch", fetchMock);

    const { records } = await restApiAdapter.extract({ base_url: "https://api.example.com" });
    expect(records).toHaveLength(2);
  });

  it("walks a records_path into a nested object", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { items: [{ id: 1 }] } }));
    vi.stubGlobal("fetch", fetchMock);

    const { records } = await restApiAdapter.extract({
      base_url: "https://api.example.com",
      records_path: "data.items",
    });
    expect(records).toEqual([{ id: 1 }]);
  });

  it("sends a bearer token when configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await restApiAdapter.extract({
      base_url: "https://api.example.com",
      auth_type: "bearer",
      api_key: "secret-token",
    });

    const [, init] = fetchMock.mock.calls[0]!;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer secret-token");
  });

  it("surfaces a non-ok response as a failed test", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(null, false, 500)));
    const result = await restApiAdapter.testConnection({ base_url: "https://api.example.com" });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/500/);
  });
});
