import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TimecardDecisionForm } from "@/components/sign/TimecardDecisionForm";

export default async function TimecardReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: timecard } = await admin.from("timecards").select("*").eq("approval_token", token).single();
  if (!timecard) notFound();

  const { data: client } = await admin.from("clients").select("name").eq("id", timecard.client_id).single();
  const { data: entries } = await admin
    .from("time_entries")
    .select("work_date, hours, description")
    .eq("timecard_id", timecard.id)
    .order("work_date", { ascending: true });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            Timecard: {timecard.period_start} – {timecard.period_end}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted">For {client?.name}.</p>
          <ul className="divide-y divide-border">
            {(entries ?? []).map((entry, index) => (
              <li key={index} className="flex items-center justify-between py-2">
                <span>
                  {entry.work_date}
                  {entry.description ? ` — ${entry.description}` : ""}
                </span>
                <span className="font-medium text-foreground">{entry.hours}h</span>
              </li>
            ))}
          </ul>
          <p className="pt-2 font-medium text-foreground">
            Total: {timecard.total_hours}h
            {timecard.total_amount != null && ` · $${Number(timecard.total_amount).toLocaleString()}`}
          </p>
        </CardContent>
      </Card>

      {timecard.status === "sent" && (
        <Card>
          <CardHeader>
            <CardTitle>Review this timecard</CardTitle>
          </CardHeader>
          <CardContent>
            <TimecardDecisionForm token={token} />
          </CardContent>
        </Card>
      )}

      {timecard.status === "client_approved" && (
        <Card>
          <CardContent className="text-sm text-success">
            Approved by {timecard.client_approved_by_name}
            {timecard.client_approved_at && ` on ${new Date(timecard.client_approved_at).toLocaleString()}`}.
          </CardContent>
        </Card>
      )}

      {timecard.status === "client_rejected" && (
        <Card>
          <CardContent className="text-sm text-danger">
            Rejected{timecard.rejection_reason ? `: ${timecard.rejection_reason}` : "."}
          </CardContent>
        </Card>
      )}

      {(timecard.status === "draft" || timecard.status === "internally_approved") && (
        <Card>
          <CardHeader>
            <CardTitle>Not ready for review yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted">
            This timecard hasn&apos;t been sent for review yet. Check back once you receive an email about it.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
