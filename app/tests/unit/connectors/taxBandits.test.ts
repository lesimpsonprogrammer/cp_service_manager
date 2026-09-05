import { afterEach, describe, expect, it, vi } from "vitest";
import { taxBanditsAdapter } from "@/lib/connectors/adapters/taxBandits";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response;
}

const baseConfig = {
  environment: "sandbox",
  client_id: "client-id",
  client_secret: "client-secret",
  user_token: "user-token",
  form_type: "1099nec",
};

describe("taxBanditsAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requires credentials before testing the connection", async () => {
    const result = await taxBanditsAdapter.testConnection({ environment: "sandbox" });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/required/i);
  });

  it("exchanges client credentials for a token, then lists forms with it", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "abc123" }))
      .mockResolvedValueOnce(jsonResponse({ Forms1099Data: [{ FormId: "f1" }, { FormId: "f2" }] }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await taxBanditsAdapter.testConnection(baseConfig);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0]!;
    expect(tokenUrl).toBe("https://testapi.taxbandits.com/v1.7.3/token");
    expect((tokenInit.headers as Record<string, string>).Authorization).toMatch(/^Basic /);

    const [listUrl, listInit] = fetchMock.mock.calls[1]!;
    expect(listUrl).toBe("https://testapi.taxbandits.com/Form1099NEC/List");
    expect((listInit.headers as Record<string, string>).Authorization).toBe("Bearer abc123");
    expect((listInit.headers as Record<string, string>).UserToken).toBe("user-token");

    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/2 filed form/);
  });

  it("uses the production base URL when configured", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "abc123" }))
      .mockResolvedValueOnce(jsonResponse({ Forms1099Data: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await taxBanditsAdapter.extract({ ...baseConfig, environment: "production" });

    const [tokenUrl] = fetchMock.mock.calls[0]!;
    expect(tokenUrl).toBe("https://api.taxbandits.com/v1.7.3/token");
  });

  it("surfaces a failed token exchange as a failed test", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(null, false, 401)));
    const result = await taxBanditsAdapter.testConnection(baseConfig);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/401/);
  });

  it("reads FormsW2Data for the W-2 form type", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "abc123" }))
      .mockResolvedValueOnce(jsonResponse({ FormsW2Data: [{ FormId: "w1" }] }));
    vi.stubGlobal("fetch", fetchMock);

    const { records } = await taxBanditsAdapter.extract({ ...baseConfig, form_type: "w2" });
    expect(records).toEqual([{ FormId: "w1" }]);
    const [listUrl] = fetchMock.mock.calls[1]!;
    expect(listUrl).toBe("https://testapi.taxbandits.com/FormW2/List");
  });
});
