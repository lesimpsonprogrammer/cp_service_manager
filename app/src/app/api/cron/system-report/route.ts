import { NextResponse } from "next/server";
import { sendSystemReports } from "@/lib/reports/systemReport";

/**
 * Invoked daily by Vercel Cron (see vercel.json). Sends every org's human
 * owner/admins a digest of new clients, new logins, and invoice status —
 * signed as Jaren CP. See `sendDueContractReminders` for the same
 * CRON_SECRET check pattern this mirrors.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendSystemReports();
  return NextResponse.json(result);
}
