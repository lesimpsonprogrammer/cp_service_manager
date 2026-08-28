import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreateApiKeyForm } from "@/components/api-keys/CreateApiKeyForm";
import { RevokeApiKeyButton } from "@/components/api-keys/RevokeApiKeyButton";
import { Badge } from "@/components/ui/Badge";

export default async function ApiKeysPage() {
  const supabase = await createClient();
  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, last_used_at, created_at, revoked_at")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="API keys"
        description={`Authenticate requests to /api/v1/* with Authorization: Bearer <key>.`}
      />

      <Card className="mb-6 p-5">
        <CreateApiKeyForm />
      </Card>

      {keys && keys.length > 0 ? (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Key</th>
                <th className="px-5 py-3 font-medium">Last used</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {keys.map((key) => (
                <tr key={key.id}>
                  <td className="px-5 py-3 font-medium text-foreground">{key.name}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted">{key.key_prefix}…</td>
                  <td className="px-5 py-3 text-muted">
                    {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : "Never"}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={key.revoked_at ? "danger" : "success"}>{key.revoked_at ? "Revoked" : "Active"}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {!key.revoked_at && <RevokeApiKeyButton apiKeyId={key.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState icon="⚿" title="No API keys yet" description="Generate one above to call the REST API." />
      )}
    </div>
  );
}
