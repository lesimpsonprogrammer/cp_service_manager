import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

export default async function WebhooksPage() {
  const supabase = await createClient();
  const { data: webhooks } = await supabase
    .from("webhooks")
    .select("id, name, direction, target_url, events, is_active, created_at")
    .order("created_at", { ascending: false });

  const inbound = webhooks?.filter((w) => w.direction === "inbound") ?? [];
  const outbound = webhooks?.filter((w) => w.direction === "outbound") ?? [];

  return (
    <div>
      <PageHeader
        title="Webhooks"
        description="Push data in from external systems, or get notified when a pipeline finishes."
        action={
          <Link href="/webhooks/new">
            <Button>+ New webhook</Button>
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inbound (receive data)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {inbound.length > 0 ? (
              <ul className="divide-y divide-border">
                {inbound.map((w) => (
                  <li key={w.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <Link href={`/webhooks/${w.id}`} className="font-medium text-foreground hover:text-brand">
                      {w.name}
                    </Link>
                    <Badge tone={w.is_active ? "success" : "neutral"}>{w.is_active ? "Active" : "Paused"}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm text-muted">No inbound webhooks yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outbound (send notifications)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {outbound.length > 0 ? (
              <ul className="divide-y divide-border">
                {outbound.map((w) => (
                  <li key={w.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <Link href={`/webhooks/${w.id}`} className="font-medium text-foreground hover:text-brand">
                      {w.name}
                    </Link>
                    <Badge tone={w.is_active ? "success" : "neutral"}>{w.is_active ? "Active" : "Paused"}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm text-muted">No outbound webhooks yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {(!webhooks || webhooks.length === 0) && (
        <div className="mt-4">
          <EmptyState
            icon="⇢"
            title="No webhooks configured"
            description="Inbound webhooks let external systems push records to a data source. Outbound webhooks notify your own systems when a pipeline finishes."
            action={
              <Link href="/webhooks/new">
                <Button>Create your first webhook</Button>
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}
