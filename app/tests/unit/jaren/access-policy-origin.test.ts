import { describe, expect, it } from "vitest";
import { checkMutationOrigin } from "../../../src/lib/jaren/access-policy";

function request(target: string, origin: string | null, fetchSite = "same-origin") {
  return new Request(target + "/api/jaren/health", {
    method: "POST",
    headers: {
      ...(origin ? { origin } : {}),
      "sec-fetch-site": fetchSite,
    },
  });
}

describe("Jaren mutation origin policy", () => {
  it.each([
    "https://app.cpservicemanager.com",
    "https://app2.cpservicemanager.com",
  ])("accepts requests from approved origin %s", (origin) => {
    expect(checkMutationOrigin(request(origin, origin), "https://app.cpservicemanager.com")).toBeNull();
  });

  it("rejects a request from another host even with an approved Origin header", () => {
    expect(checkMutationOrigin(request("https://untrusted.example", "https://app.cpservicemanager.com"), "https://app.cpservicemanager.com")?.status).toBe(403);
  });

  it("rejects a different Origin on an approved host", () => {
    expect(checkMutationOrigin(request("https://app.cpservicemanager.com", "https://app2.cpservicemanager.com"))?.status).toBe(403);
  });

  it("rejects a missing Origin", () => {
    expect(checkMutationOrigin(request("https://app.cpservicemanager.com", null))?.status).toBe(403);
  });

  it("rejects cross-site browser requests", () => {
    expect(checkMutationOrigin(request("https://app.cpservicemanager.com", "https://app.cpservicemanager.com", "cross-site"))?.status).toBe(403);
  });

  it("keeps preview origins restricted unless explicitly configured", () => {
    expect(checkMutationOrigin(request("https://preview.example", "https://preview.example"), "https://app.cpservicemanager.com")?.status).toBe(403);
    expect(checkMutationOrigin(request("https://preview.example", "https://preview.example"), "https://preview.example")).toBeNull();
  });
});
