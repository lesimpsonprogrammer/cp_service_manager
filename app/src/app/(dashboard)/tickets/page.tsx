import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { getOrgMembers } from "@/lib/org/getOrgMembers";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Input";
import { StatCard } from "@/components/ui/StatCard";
import { TicketQueue } from "@/components/glass/TicketQueue";
import { TicketBoard } from "@/components/glass/TicketBoard";
import { TicketLiveRefresh } from "@/components/glass/TicketLiveRefresh";
import { buildQueueRows } from "@/components/glass/buildQueueRows";
import { cn } from "@/lib/utils/cn";
import { ACTIVE_STATUSES, PRIORITY_LABELS, TICKET_PRIORITIES, TICKET_TYPES, TYPE_LABELS } from "@/lib/glass/constants";
import { fetchQueue, parseQueueFilters, queueHref, QUEUE_LABELS, QUEUES, SORT_LABELS, SORTS } from "@/lib/glass/queue";
import { getSlaSnapshot } from "@/lib/glass/sla";
import { hoursAgoIso } from "@/lib/utils/time";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const org = await getCurrentOrg();
  if (!org) redirect("/login");

  const filters = parseQueueFilters(await searchParams);
  const supabase = await createClient();
  const thirtyDaysAgo = hoursAgoIso(24 * 30);

  const [rows, members, { data: clients }, { data: categories }, { data: activeForStats }, { data: recentlyResolved }] =
    await Promise.all([
      fetchQueue(supabase, org.orgId, org.userId, filters),
      getOrgMembers(org.orgId),
      supabase.from("clients").select("id, name").order("name"),
      supabase.from("ticket_categories").select("id, name, is_active").eq("org_id", org.orgId).order("name"),
      supabase
        .from("tickets")
        .select("status, assignee_id, first_response_due_at, resolution_due_at, first_responded_at, resolved_at, sla_paused_at")
        .eq("org_id", org.orgId)
        .in("status", ACTIVE_STATUSES)
        .limit(5000),
      supabase
        .from("tickets")
        .select("satisfaction_rating")
        .eq("org_id", org.orgId)
        .gte("resolved_at", thirtyDaysAgo)
        .limit(5000),
    ]);

  const now = new Date();
  const active = activeForStats ?? [];
  const snapshots = active.map((t) => getSlaSnapshot(t, now).overall);
  const ratings = (recentlyResolved ?? []).map((t) => t.satisfaction_rating).filter((r): r is number => r !== null);
  const csat = ratings.length ? ratings.filter((r) => r >= 4).length / ratings.length : null;

  const tableRows = buildQueueRows(
    rows,
    {
      clientNames: new Map((clients ?? []).map((c) => [c.id, c.name])),
      memberNames: new Map(members.map((m) => [m.userId, m.fullName])),
      categoryNames: new Map((categories ?? []).map((c) => [c.id, c.name])),
    },
    now
  );

  const isAdmin = org.role === "owner" || org.role === "admin";
  const canEdit = org.role !== "viewer";
  const hasFilters = !!(filters.q || filters.priority || filters.type || filters.clientId || filters.categoryId || filters.assigneeId);

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            GLASS Tickets <TicketLiveRefresh orgId={org.orgId} />
          </span>
        }
        description="Service desk for client requests and internal issues — SLAs, ownership, and the full conversation in one place."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <Link href="/tickets/settings">
                <Button variant="ghost" size="sm">
                  Settings
                </Button>
              </Link>
            )}
            <a href={queueHref(filters, {}, "/tickets/export")}>
              <Button variant="secondary" size="sm">
                Export CSV
              </Button>
            </a>
            {canEdit && (
              <Link href="/tickets/new">
                <Button size="sm">New ticket</Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Open" value={active.length} tone="brand" />
        <StatCard label="Unassigned" value={active.filter((t) => !t.assignee_id).length} />
        <StatCard label="Mine" value={active.filter((t) => t.assignee_id === org.userId).length} />
        <StatCard label="SLA breached" value={snapshots.filter((s) => s === "breached").length} />
        <StatCard label="Due < 2h" value={snapshots.filter((s) => s === "due_soon").length} />
        <StatCard
          label="CSAT (30d)"
          value={csat === null ? "—" : `${Math.round(csat * 100)}%`}
          hint={ratings.length ? `${ratings.length} rating${ratings.length === 1 ? "" : "s"}` : "No ratings yet"}
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <nav className="flex flex-wrap gap-1" aria-label="Ticket queues">
          {QUEUES.map((queue) => (
            <Link
              key={queue}
              href={queueHref(filters, { queue })}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                filters.queue === queue ? "bg-brand/10 text-brand dark:text-white" : "text-muted hover:bg-surface-2 hover:text-foreground"
              )}
            >
              {QUEUE_LABELS[queue]}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex rounded-md border border-border p-0.5 text-xs">
          {(["list", "board"] as const).map((view) => (
            <Link
              key={view}
              href={queueHref(filters, { view })}
              className={cn(
                "rounded px-2.5 py-1 font-medium capitalize",
                filters.view === view ? "bg-surface-2 text-foreground" : "text-muted hover:text-foreground"
              )}
            >
              {view}
            </Link>
          ))}
        </div>
      </div>

      <Card className="mb-4 p-3">
        <form method="get" className="grid grid-cols-2 items-center gap-2 md:grid-cols-4 xl:grid-cols-8">
          {filters.queue !== "open" && <input type="hidden" name="queue" value={filters.queue} />}
          {filters.view !== "list" && <input type="hidden" name="view" value={filters.view} />}
          <Input name="q" defaultValue={filters.q} placeholder="Search subject, GLS-number, requester…" className="col-span-2 h-8 text-xs" aria-label="Search tickets" />
          <Select name="priority" defaultValue={filters.priority ?? ""} className="h-8 text-xs" aria-label="Priority">
            <option value="">Any priority</option>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
          <Select name="type" defaultValue={filters.type ?? ""} className="h-8 text-xs" aria-label="Type">
            <option value="">Any type</option>
            {TICKET_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
          <Select name="client" defaultValue={filters.clientId ?? ""} className="h-8 text-xs" aria-label="Client">
            <option value="">Any client</option>
            {(clients ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select name="category" defaultValue={filters.categoryId ?? ""} className="h-8 text-xs" aria-label="Category">
            <option value="">Any category</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select name="assignee" defaultValue={filters.assigneeId ?? ""} className="h-8 text-xs" aria-label="Assignee">
            <option value="">Any assignee</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.fullName}
              </option>
            ))}
          </Select>
          <Select name="sort" defaultValue={filters.sort} className="h-8 text-xs" aria-label="Sort">
            {SORTS.map((s) => (
              <option key={s} value={s}>
                Sort: {SORT_LABELS[s]}
              </option>
            ))}
          </Select>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" variant="secondary">
              Apply
            </Button>
            {hasFilters && (
              <Link href={queueHref(filters, { q: "", priority: null, type: null, clientId: null, categoryId: null, assigneeId: null })} className="text-xs text-muted hover:text-foreground">
                Clear
              </Link>
            )}
          </div>
        </form>
      </Card>

      {tableRows.length === 0 ? (
        <EmptyState
          icon="🎫"
          title={hasFilters || filters.queue !== "open" ? "No tickets match this view" : "The queue is clear"}
          description={
            hasFilters || filters.queue !== "open"
              ? "Try another queue or clear the filters."
              : "New requests from the client portal, the API, and your team land here."
          }
          action={
            canEdit ? (
              <Link href="/tickets/new">
                <Button size="sm">New ticket</Button>
              </Link>
            ) : undefined
          }
        />
      ) : filters.view === "board" ? (
        <TicketBoard rows={tableRows} />
      ) : (
        <TicketQueue rows={tableRows} members={members} canEdit={canEdit} />
      )}
      {rows.length >= 500 && (
        <p className="mt-3 text-xs text-muted">Showing the 500 most recently active tickets — narrow the filters to see older ones.</p>
      )}
    </div>
  );
}
