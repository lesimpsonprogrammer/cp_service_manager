import { createAdminClient } from "@/lib/supabase/admin";
import { sendSystemReportEmail } from "@/lib/email/resend";

const LOOKBACK_DAYS = 7;
const DUE_SOON_DAYS = 7;
const HUMAN_ADMIN_ROLES = new Set(["owner", "admin"]);

export interface SystemReportSection {
  newClients: { id: string; name: string; createdAt: string }[];
  newLogins: { email: string; lastSignInAt: string }[];
  unpaidInvoices: {
    id: string;
    invoiceNumber: string;
    clientName: string;
    total: number;
    dueDate: string | null;
    status: string;
  }[];
  invoicesDueSoon: {
    id: string;
    invoiceNumber: string;
    clientName: string;
    total: number;
    dueDate: string;
  }[];
}

/**
 * Gathers the org-wide digest Jaren sends: new clients, new logins, unpaid
 * invoices, and invoices coming due. There is no task/workflow-tracking
 * table live in this database right now (that schema exists on unmerged
 * branches only), so "outstanding tasks" is intentionally left out rather
 * than reported against data that doesn't exist yet.
 */
export async function buildSystemReport(orgId: string): Promise<SystemReportSection> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const dueSoonCutoff = new Date(Date.now() + DUE_SOON_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const { data: newClients } = await admin
    .from("clients")
    .select("id, name, created_at")
    .eq("org_id", orgId)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  const { data: memberRows } = await admin
    .from("org_members")
    .select("user_id")
    .eq("org_id", orgId);

  const memberIds = new Set((memberRows ?? []).map((m) => m.user_id));
  const { data: usersPage } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const newLogins = (usersPage?.users ?? [])
    .filter(
      (u) =>
        memberIds.has(u.id) &&
        u.last_sign_in_at &&
        u.last_sign_in_at >= since
    )
    .map((u) => ({ email: u.email ?? "unknown", lastSignInAt: u.last_sign_in_at! }))
    .sort((a, b) => (a.lastSignInAt < b.lastSignInAt ? 1 : -1));

  const { data: invoices } = await admin
    .from("invoices")
    .select("id, invoice_number, total, due_date, status, client_id, clients ( name )")
    .eq("org_id", orgId)
    .not("status", "in", "(paid,void)")
    .returns<
      {
        id: string;
        invoice_number: string;
        total: number;
        due_date: string | null;
        status: string;
        client_id: string;
        clients: { name: string } | null;
      }[]
    >();

  const unpaidInvoices = (invoices ?? [])
    .filter((inv) => !inv.due_date || inv.due_date < today || inv.status === "overdue")
    .map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      clientName: inv.clients?.name ?? "Unknown client",
      total: inv.total,
      dueDate: inv.due_date,
      status: inv.status,
    }));

  const invoicesDueSoon = (invoices ?? [])
    .filter((inv) => inv.due_date && inv.due_date >= today && inv.due_date <= dueSoonCutoff)
    .map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      clientName: inv.clients?.name ?? "Unknown client",
      total: inv.total,
      dueDate: inv.due_date as string,
    }));

  return {
    newClients: (newClients ?? []).map((c) => ({ id: c.id, name: c.name, createdAt: c.created_at })),
    newLogins,
    unpaidInvoices,
    invoicesDueSoon,
  };
}

/**
 * Builds and emails the digest for every org that has at least one human
 * owner/admin to send it to. Called by the daily cron route.
 */
export async function sendSystemReports(): Promise<{ orgsReported: number }> {
  const admin = createAdminClient();

  const { data: orgs } = await admin.from("organizations").select("id, name");
  if (!orgs) return { orgsReported: 0 };

  let orgsReported = 0;

  for (const org of orgs) {
    const { data: admins } = await admin
      .from("org_members")
      .select("user_id, role")
      .eq("org_id", org.id);

    const recipientIds = (admins ?? [])
      .filter((m) => HUMAN_ADMIN_ROLES.has(m.role))
      .map((m) => m.user_id);
    if (recipientIds.length === 0) continue;

    const { data: usersPage } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const recipientEmails = (usersPage?.users ?? [])
      .filter((u) => recipientIds.includes(u.id) && u.email)
      .map((u) => u.email!);
    if (recipientEmails.length === 0) continue;

    const report = await buildSystemReport(org.id);
    const hasContent =
      report.newClients.length > 0 ||
      report.newLogins.length > 0 ||
      report.unpaidInvoices.length > 0 ||
      report.invoicesDueSoon.length > 0;
    if (!hasContent) continue;

    await sendSystemReportEmail({ to: recipientEmails, orgName: org.name, report });
    orgsReported += 1;
  }

  return { orgsReported };
}
