import { NextResponse } from "next/server";
import { reportJob } from "@/lib/webhooks/emit";
import { runServiceDeskMaintenance } from "@/lib/service-desk/maintenance";

/**
 * Invoked daily by Vercel Cron (see vercel.json). Same CRON_SECRET bearer
 * check as the other cron routes.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await reportJob("service-desk-maintenance", () => runServiceDeskMaintenance(), (r) =>
    r.errors.length ? r.errors.join("; ") : null
  );
  return NextResponse.json(result, { status: result.errors.length ? 207 : 200 });
}
