import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProjectsPanel } from "@/components/clients/ProjectsPanel";
import { TimeEntryForm } from "@/components/clients/TimeEntryForm";
import { TimeEntriesList } from "@/components/clients/TimeEntriesList";
import { TimecardCard } from "@/components/clients/TimecardCard";
import { NewTimecardForm } from "@/components/clients/NewTimecardForm";

export default async function ClientTimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, billing_contact_name, billing_contact_email")
    .eq("id", id)
    .single();
  if (!client) notFound();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, project_code, status")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  const { data: contracts } = await supabase
    .from("client_contracts")
    .select("id, name, hourly_rate")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  const { data: entries } = await supabase
    .from("time_entries")
    .select("id, work_date, hours, description, billable, contract_id, project_id")
    .eq("client_id", id)
    .order("work_date", { ascending: false });

  const { data: timecards } = await supabase
    .from("timecards")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  const projectList = projects ?? [];
  const contractList = contracts ?? [];
  const contractNames = new Map(contractList.map((c) => [c.id, c.name]));
  const contractRates = new Map(contractList.map((c) => [c.id, c.hourly_rate]));
  const projectNames = new Map(projectList.map((p) => [p.id, `${p.name} (${p.project_code})`]));

  const entryList = entries ?? [];
  const totalHours = entryList.reduce((sum, e) => sum + e.hours, 0);
  const billableHours = entryList.filter((e) => e.billable).reduce((sum, e) => sum + e.hours, 0);

  const amountByContract = new Map<string, number>();
  for (const entry of entryList) {
    if (!entry.billable || !entry.contract_id) continue;
    const rate = contractRates.get(entry.contract_id);
    if (rate == null) continue;
    amountByContract.set(entry.contract_id, (amountByContract.get(entry.contract_id) ?? 0) + entry.hours * rate);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ProjectsPanel clientId={id} projects={projectList} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-foreground">
            {totalHours.toFixed(2)}h logged total, {billableHours.toFixed(2)}h billable.
          </p>
          {[...amountByContract.entries()].map(([contractId, amount]) => (
            <p key={contractId} className="text-muted">
              {contractNames.get(contractId)}: ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
              estimated
            </p>
          ))}
          {amountByContract.size === 0 && (
            <p className="text-xs text-muted">
              Link entries to a contract with an hourly rate to see an estimated billable amount here.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TimeEntriesList clientId={id} entries={entryList} contractNames={contractNames} projectNames={projectNames} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log time</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeEntryForm clientId={id} projects={projectList} contracts={contractList} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timecards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(timecards ?? []).length === 0 && <p className="text-sm text-muted">No timecards yet.</p>}
          {(timecards ?? []).map((timecard) => (
            <TimecardCard
              key={timecard.id}
              clientId={id}
              timecard={timecard}
              defaultApproverName={client.billing_contact_name}
              defaultApproverEmail={client.billing_contact_email}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submit a timecard</CardTitle>
        </CardHeader>
        <CardContent>
          <NewTimecardForm clientId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
