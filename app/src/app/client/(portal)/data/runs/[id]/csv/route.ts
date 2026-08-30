import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentClientPortalUser } from "@/lib/portal/getCurrentClientPortalUser";
import { recordsToCsv } from "@/lib/etl/csv";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const clientUser = await getCurrentClientPortalUser();
  if (!clientUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id } = await params;
  const supabase = await createClient();

  // RLS already scopes pipeline_runs to the signed-in client's own pipelines,
  // so this select can't return another client's run.
  const { data: run } = await supabase
    .from("pipeline_runs")
    .select("run_number, output_sample")
    .eq("id", id)
    .single();

  const records = run?.output_sample as Record<string, unknown>[] | null;
  if (!run || !records || records.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const csv = recordsToCsv(records);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${run.run_number}.csv"`,
    },
  });
}
