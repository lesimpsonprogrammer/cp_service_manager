import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

export default async function TimeTrackingPage() {
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("time_entries")
    .select("id, work_date, hours, description, billable, client_id, contract_id, project_id")
    .order("work_date", { ascending: false })
    .limit(200);

  const { data: clients } = await supabase.from("clients").select("id, name");
  const { data: contracts } = await supabase.from("client_contracts").select("id, name");
  const { data: projects } = await supabase.from("projects").select("id, name, project_code");

  const clientNames = new Map((clients ?? []).map((c) => [c.id, c.name]));
  const contractNames = new Map((contracts ?? []).map((c) => [c.id, c.name]));
  const projectNames = new Map((projects ?? []).map((p) => [p.id, `${p.name} (${p.project_code})`]));

  const entryList = entries ?? [];
  const totalHours = entryList.reduce((sum, e) => sum + e.hours, 0);
  const billableHours = entryList.filter((e) => e.billable).reduce((sum, e) => sum + e.hours, 0);

  return (
    <div>
      <PageHeader
        title="Time Tracking"
        description="Billable hours logged across every client, most recent first."
      />

      {entryList.length > 0 ? (
        <>
          <Card className="mb-4 p-4 text-sm text-muted">
            {totalHours.toFixed(2)}h logged total across all clients — {billableHours.toFixed(2)}h billable.
          </Card>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Client</th>
                    <th className="px-5 py-3 font-medium">Project</th>
                    <th className="px-5 py-3 font-medium">Contract</th>
                    <th className="px-5 py-3 font-medium">Hours</th>
                    <th className="px-5 py-3 font-medium">Billable</th>
                    <th className="px-5 py-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entryList.map((entry) => (
                    <tr key={entry.id} className="hover:bg-surface-2/60">
                      <td className="px-5 py-3 text-muted">{entry.work_date}</td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/clients/${entry.client_id}/time`}
                          className="font-medium text-foreground hover:text-brand"
                        >
                          {clientNames.get(entry.client_id) ?? "—"}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted">{projectNames.get(entry.project_id) ?? "—"}</td>
                      <td className="px-5 py-3 text-muted">
                        {entry.contract_id ? contractNames.get(entry.contract_id) ?? "—" : "—"}
                      </td>
                      <td className="px-5 py-3 text-foreground">{entry.hours}</td>
                      <td className="px-5 py-3">
                        <Badge tone={entry.billable ? "success" : "neutral"}>
                          {entry.billable ? "Billable" : "Non-billable"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-muted">{entry.description ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <EmptyState
          icon="⏱"
          title="No time logged yet"
          description="Log time from any client's Time Tracking tab — it'll show up here across your whole workspace."
        />
      )}
    </div>
  );
}
