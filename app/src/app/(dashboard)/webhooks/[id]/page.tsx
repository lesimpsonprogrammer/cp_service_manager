import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { WebhookControls } from "@/components/webhooks/WebhookControls";

export default async function WebhookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: webhook } = await supabase.from("webhooks").select("*").eq("id", id).single();
  if (!webhook) notFound();

  const { data: deliveries } = await supabase
    .from("webhook_deliveries")
    .select("*")
    .eq("webhook_id", webhook.id)
    .order("created_at", { ascending: false })
    .limit(25);

  const inboundUrl =
    webhook.direction === "inbound"
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/inbound/${webhook.inbound_token}`
      : null;

  return (
    <div>
      <PageHeader
        title={webhook.name}
        description={`${webhook.direction} webhook`}
        action={<WebhookControls webhookId={webhook.id} isActive={webhook.is_active} />}
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {inboundUrl && (
            <div>
              <p className="text-muted">Receiver URL</p>
              <code className="mt-1 block break-all rounded-md bg-surface-2 px-3 py-2 text-xs">{inboundUrl}</code>
            </div>
          )}
          {webhook.target_url && (
            <div>
              <p className="text-muted">Target URL</p>
              <code className="mt-1 block break-all rounded-md bg-surface-2 px-3 py-2 text-xs">{webhook.target_url}</code>
            </div>
          )}
          {webhook.events?.length > 0 && (
            <div>
              <p className="mb-1 text-muted">Subscribed events</p>
              <div className="flex flex-wrap gap-1.5">
                {webhook.events.map((e) => (
                  <Badge key={e} tone="brand">
                    {e}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-muted">Signing secret</p>
            <code className="mt-1 block break-all rounded-md bg-surface-2 px-3 py-2 text-xs">{webhook.secret}</code>
            <p className="mt-1 text-xs text-muted">
              {webhook.direction === "inbound"
                ? "Send an X-CPSM-Signature header: hex HMAC-SHA256 of the raw request body using this secret."
                : "We sign each delivery with an X-CPSM-Signature header: hex HMAC-SHA256 of the request body using this secret."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {deliveries && deliveries.length > 0 ? (
            <ul className="divide-y divide-border">
              {deliveries.map((d) => (
                <li key={d.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{d.event}</p>
                    <p className="text-xs text-muted">{new Date(d.created_at).toLocaleString()}</p>
                  </div>
                  <Badge tone={d.success ? "success" : "danger"}>
                    {d.success ? "Delivered" : d.error ?? "Failed"}
                    {d.response_status ? ` (${d.response_status})` : ""}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-sm text-muted">No deliveries yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
