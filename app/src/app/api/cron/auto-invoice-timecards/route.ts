import { NextResponse } from "next/server";
import { autoInvoiceApprovedTimecards } from "@/lib/invoices/autoInvoiceTimecards";

/**
 * Invoked weekly by Vercel Cron (see vercel.json). Vercel automatically
 * sends `Authorization: Bearer $CRON_SECRET` on cron-triggered requests
 * when CRON_SECRET is set as an env var, which is what we check here.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await autoInvoiceApprovedTimecards();
  return NextResponse.json(result);
}
