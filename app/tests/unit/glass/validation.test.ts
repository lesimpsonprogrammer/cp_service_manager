import { describe, expect, it } from "vitest";
import {
  apiUpdateTicketSchema,
  bulkUpdateSchema,
  clientCreateTicketSchema,
  parseApiCreateTicket,
  parseTags,
  safeFileName,
  sanitizeSearch,
  slaPolicySchema,
  staffCreateTicketSchema,
  validateAttachments,
} from "@/lib/glass/validation";

const UUID = "3f2b8c1e-9a4d-4c2b-8e1f-0a1b2c3d4e5f";

describe("parseTags", () => {
  it("normalizes, dedupes, and caps tags", () => {
    expect(parseTags(" Payroll, Q3 Export ,payroll,,ADP!")).toEqual(["payroll", "q3-export", "adp"]);
    expect(parseTags(Array.from({ length: 15 }, (_, i) => `t${i}`))).toHaveLength(10);
  });
});

describe("sanitizeSearch", () => {
  it("strips PostgREST filter syntax", () => {
    expect(sanitizeSearch("a,b(c)%d*e\"f'g:h\\i")).toBe("a b c d e f g h i");
  });
  it("keeps emails and ticket numbers searchable", () => {
    expect(sanitizeSearch("ann@acme.com")).toBe("ann@acme.com");
    expect(sanitizeSearch("GLS-1042")).toBe("GLS-1042");
  });
});

describe("staffCreateTicketSchema", () => {
  const base = {
    subject: "Payroll export failed",
    description: "",
    client_id: "",
    project_id: "",
    category_id: "",
    assignee_id: "",
    requester_name: "",
    requester_email: "",
    tags: "",
  };

  it("turns blank optional fields into nulls and applies defaults", () => {
    const parsed = staffCreateTicketSchema.parse(base);
    expect(parsed).toMatchObject({
      priority: "normal",
      type: "question",
      status: "new",
      client_id: null,
      requester_email: null,
      tags: [],
      client_visible: true,
    });
  });

  it("rejects a malformed id instead of passing it to the database", () => {
    expect(staffCreateTicketSchema.safeParse({ ...base, client_id: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects a bad requester email", () => {
    expect(staffCreateTicketSchema.safeParse({ ...base, requester_email: "nope" }).success).toBe(false);
  });

  it("does not allow creating a ticket straight into resolved", () => {
    expect(staffCreateTicketSchema.safeParse({ ...base, status: "resolved" }).success).toBe(false);
  });
});

describe("clientCreateTicketSchema", () => {
  it("requires a real description from clients", () => {
    const result = clientCreateTicketSchema.safeParse({ subject: "Help", description: "short", category_id: "", project_id: "" });
    expect(result.success).toBe(false);
  });
});

describe("API schemas", () => {
  it("accepts JSON nulls on create", () => {
    const parsed = parseApiCreateTicket({ subject: "From Zapier", client_id: null, tags: ["Ops"] });
    expect(parsed.success && parsed.data).toMatchObject({ client_id: null, tags: ["ops"] });
  });

  it("rejects unknown fields on update so typos don't silently no-op", () => {
    expect(apiUpdateTicketSchema.safeParse({ stauts: "closed" }).success).toBe(false);
    expect(apiUpdateTicketSchema.safeParse({}).success).toBe(false);
    expect(apiUpdateTicketSchema.safeParse({ status: "closed", assignee_id: null }).success).toBe(true);
  });
});

describe("bulkUpdateSchema", () => {
  it("needs a selection and at least one change", () => {
    expect(bulkUpdateSchema.safeParse({ ticket_ids: [], status: "open" }).success).toBe(false);
    expect(bulkUpdateSchema.safeParse({ ticket_ids: [UUID] }).success).toBe(false);
    expect(bulkUpdateSchema.safeParse({ ticket_ids: [UUID], assignee_id: "unassigned" }).success).toBe(true);
  });
});

describe("slaPolicySchema", () => {
  it("rejects a resolution target shorter than first response", () => {
    expect(slaPolicySchema.safeParse({ priority: "high", first_response_minutes: 600, resolution_minutes: 60 }).success).toBe(false);
  });
});

describe("validateAttachments", () => {
  const file = (name: string, size: number, type: string) => ({ name, size, type });

  it("drops the empty entry browsers send for an untouched file input", () => {
    const result = validateAttachments([file("", 0, "application/octet-stream")]);
    expect(result).toEqual({ ok: true, files: [] });
  });

  it("accepts common business files", () => {
    expect(validateAttachments([file("register.xlsx", 2048, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")]).ok).toBe(true);
  });

  it("rejects executables and oversized files", () => {
    expect(validateAttachments([file("payload.exe", 100, "application/x-msdownload")]).ok).toBe(false);
    expect(validateAttachments([file("renamed.pdf", 100, "application/x-msdownload")]).ok).toBe(false);
    expect(validateAttachments([file("big.pdf", 5 * 1024 * 1024, "application/pdf")]).ok).toBe(false);
  });

  it("caps the number of files", () => {
    expect(validateAttachments(Array.from({ length: 6 }, (_, i) => file(`f${i}.png`, 10, "image/png"))).ok).toBe(false);
  });
});

describe("safeFileName", () => {
  it("removes path traversal and odd characters", () => {
    expect(safeFileName("../../etc/passwd")).toBe("passwd");
    expect(safeFileName("C:\\Users\\me\\Q3 report (final).pdf")).toBe("Q3_report_final.pdf");
    expect(safeFileName("...")).toBe("file");
  });
});
