import { describe, expect, it } from "vitest";
import {
  bearerToken,
  chatReturnUrl,
  chatSubject,
  hashIp,
  hashToken,
  isOnline,
  isOriginAllowed,
  newVisitorToken,
  startChatSchema,
  toVisitorMessages,
} from "@/lib/chat/widget";

describe("visitor tokens", () => {
  it("are long, url-safe, unique, and only stored hashed", () => {
    const a = newVisitorToken();
    const b = newVisitorToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(a).not.toBe(b);
    expect(hashToken(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(a)).toBe(hashToken(a));
    expect(hashToken(a)).not.toBe(a);
  });

  it("are read only from a well-formed Bearer header", () => {
    const token = newVisitorToken();
    expect(bearerToken(new Request("https://x", { headers: { Authorization: `Bearer ${token}` } }))).toBe(token);
    expect(bearerToken(new Request("https://x", { headers: { Authorization: `Basic ${token}` } }))).toBeNull();
    expect(bearerToken(new Request("https://x", { headers: { Authorization: "Bearer a'; drop table" } }))).toBeNull();
    expect(bearerToken(new Request("https://x"))).toBeNull();
  });
});

describe("hashIp", () => {
  it("is salted per workspace", () => {
    expect(hashIp("203.0.113.9", "org-a")).not.toBe(hashIp("203.0.113.9", "org-b"));
    expect(hashIp(null, "org-a")).toBeNull();
  });
});

describe("isOriginAllowed", () => {
  const sites = ["https://momentumdatasolutions.com", "https://www.momentumdatasolutions.com"];

  it("allows listed sites, ignoring case and trailing paths", () => {
    expect(isOriginAllowed("https://www.momentumdatasolutions.com", sites)).toBe(true);
    expect(isOriginAllowed("https://WWW.MomentumDataSolutions.com", sites)).toBe(true);
  });

  it("rejects look-alikes, other schemes, and missing origins", () => {
    expect(isOriginAllowed("https://momentumdatasolutions.com.evil.example", sites)).toBe(false);
    expect(isOriginAllowed("http://www.momentumdatasolutions.com", sites)).toBe(false);
    expect(isOriginAllowed(null, sites)).toBe(false);
  });

  it("allows any site when the list is empty", () => {
    expect(isOriginAllowed("https://anything.example", [])).toBe(true);
    expect(isOriginAllowed(null, [])).toBe(true);
  });
});

describe("startChatSchema", () => {
  const base = { key: "mds-website", email: " Pat@Example.com ", message: "  Do you handle ADP exports?  " };

  it("normalizes a valid start", () => {
    const parsed = startChatSchema.parse({ ...base, name: "", page_url: "https://www.momentumdatasolutions.com/services.html" });
    expect(parsed).toMatchObject({ email: "pat@example.com", message: "Do you handle ADP exports?", name: null });
    expect(parsed.page_url).toBe("https://www.momentumdatasolutions.com/services.html");
  });

  it("requires an email and a message", () => {
    expect(startChatSchema.safeParse({ ...base, email: "nope" }).success).toBe(false);
    expect(startChatSchema.safeParse({ ...base, message: "   " }).success).toBe(false);
    expect(startChatSchema.safeParse({ ...base, message: "x".repeat(4001) }).success).toBe(false);
  });

  it("drops non-http page URLs and rejects odd widget keys", () => {
    expect(startChatSchema.parse({ ...base, page_url: "javascript:alert(1)" }).page_url).toBeNull();
    expect(startChatSchema.safeParse({ ...base, key: "../../etc" }).success).toBe(false);
  });
});

describe("chat helpers", () => {
  it("builds a short ticket subject from the first message", () => {
    expect(chatSubject("Hi\n\nthere")).toBe("Website chat: Hi there");
    const long = chatSubject("word ".repeat(40));
    expect(long.length).toBeLessThanOrEqual("Website chat: ".length + 78);
    expect(long.endsWith("…")).toBe(true);
  });

  it("sends visitors back to the site with the chat open", () => {
    expect(chatReturnUrl("https://www.example.com/")).toBe("https://www.example.com/?chat=open");
    expect(chatReturnUrl(null)).toBe("https://www.momentumdatasolutions.com/?chat=open");
  });

  it("treats a recent poll as online", () => {
    const now = Date.parse("2026-10-24T12:00:00Z");
    expect(isOnline("2026-10-24T11:59:30Z", now)).toBe(true);
    expect(isOnline("2026-10-24T11:58:00Z", now)).toBe(false);
    expect(isOnline(null, now)).toBe(false);
  });
});

describe("toVisitorMessages", () => {
  const ticket = { id: "t1", description: "Hello?", created_at: "2026-10-24T12:00:00Z", requester_name: "Pat" };

  it("starts with the opening message and hides internal notes and system lines", () => {
    const out = toVisitorMessages(ticket, [
      { id: "m1", author_type: "staff", author_name: "Larry Simpson", body: "Hi Pat!", is_internal: false, created_at: "2026-10-24T12:01:00Z" },
      { id: "m2", author_type: "staff", author_name: "Larry Simpson", body: "Looks like a lead", is_internal: true, created_at: "2026-10-24T12:01:30Z" },
      { id: "m3", author_type: "system", author_name: null, body: "Auto-closed", is_internal: false, created_at: "2026-10-24T12:02:00Z" },
      { id: "m4", author_type: "client", author_name: "Pat", body: "Thanks", is_internal: false, created_at: "2026-10-24T12:03:00Z" },
    ]);
    expect(out.map((m) => [m.from, m.body])).toEqual([
      ["visitor", "Hello?"],
      ["team", "Hi Pat!"],
      ["visitor", "Thanks"],
    ]);
  });

  it("shows staff by first name only", () => {
    const [, reply] = toVisitorMessages(ticket, [
      { id: "m1", author_type: "staff", author_name: "Larry Simpson", body: "Hi", is_internal: false, created_at: "2026-10-24T12:01:00Z" },
    ]);
    expect(reply!.name).toBe("Larry");
  });
});
