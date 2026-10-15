import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { getOrgMembers } from "@/lib/org/getOrgMembers";
import { CHANNEL_LABELS, PRIORITY_LABELS, STATUS_LABELS, TYPE_LABELS } from "@/lib/glass/constants";
import { csvCell, fetchQueue, parseQueueFilters } from "@/lib/glass/queue";
import { getSlaSnapshot } from "@/lib/glass/sla";

// CSV of exactly what the queue is showing (same filters), RLS-scoped.
export async function GET(request: Request) {
  const org = await getCurrentOrg();
  if (!org) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const url = new URL(request.url);
  const filters = parseQueueFilters(Object.fromEntries(url.searchParams.entries()));
  const supabase = await createClient();

  const [rows, members, { data: clients }, { data: categories }] = await Promise.all([
    fetchQueue(supabase, org.orgId, org.userId, filters, 5000),
    getOrgMembers(org.orgId),
    supabase.from("clients").select("id, name"),
    supabase.from("ticket_categories").select("id, name").eq("org_id", org.orgId),
  ]);
  const clientNames = new Map((clients ?? []).map((c) => [c.id, c.name]));
  const memberNames = new Map(members.map((m) => [m.userId, m.fullName]));
  const categoryNames = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const now = new Date();

  const header = [
    "Ticket",
    "Subject",
    "Status",
    "Priority",
    "Type",
    "Channel",
    "Client",
    "Category",
    "Assignee",
    "Requester",
    "Requester email",
    "Tags",
    "SLA",
    "First response due",
    "First responded",
    "Resolution due",
    "Resolved",
    "Satisfaction",
    "Created",
    "Last activity",
  ];

  const lines = rows.map((r) =>
    [
      r.ticket_number,
      r.subject,
      STATUS_LABELS[r.status],
      PRIORITY_LABELS[r.priority],
      TYPE_LABELS[r.type],
      CHANNEL_LABELS[r.channel],
      r.client_id ? clientNames.get(r.client_id) ?? "" : "Internal",
      r.category_id ? categoryNames.get(r.category_id) ?? "" : "",
      r.assignee_id ? memberNames.get(r.assignee_id) ?? "Former teammate" : "",
      r.requester_name,
      r.requester_email,
      r.tags,
      getSlaSnapshot(r, now).overall,
      r.first_response_due_at,
      r.first_responded_at,
      r.resolution_due_at,
      r.resolved_at,
      r.satisfaction_rating,
      r.created_at,
      r.last_activity_at,
    ]
      .map(csvCell)
      .join(",")
  );

  const csv = [header.map(csvCell).join(","), ...lines].join("\r\n");
  const stamp = now.toISOString().slice(0, 10);
  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="glass-tickets-${filters.queue}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
