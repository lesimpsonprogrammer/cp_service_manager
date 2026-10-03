import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArtifactTable, ARTIFACT_LIST_SELECT, type ArtifactListItem } from "@/components/artifacts/ArtifactTable";
import { CreateBucketForm } from "@/components/artifacts/CreateBucketForm";
import { UploadArtifactForm } from "@/components/artifacts/UploadArtifactForm";
import { formatBytes, parseTags, sanitizeSearch } from "@/lib/artifacts/keys";

const ADMIN_ROLES = new Set(["owner", "admin", "sys_admin"]);

export default async function ArtifactsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const search = sanitizeSearch(q);
  const org = await getCurrentOrg();
  const supabase = await createClient();

  let artifactQuery = supabase
    .from("artifacts")
    .select(ARTIFACT_LIST_SELECT)
    .eq("is_latest", true)
    .order("created_at", { ascending: false })
    .limit(search ? 100 : 15);
  if (search) {
    const tag = parseTags(search)[0];
    const filters = [`key.ilike."*${search}*"`, `description.ilike."*${search}*"`];
    if (tag) filters.push(`tags.cs.{${tag}}`);
    artifactQuery = artifactQuery.or(filters.join(","));
  }

  const [{ data: buckets }, { data: stats }, { data: artifacts }, { data: clients }] = await Promise.all([
    supabase.from("artifact_buckets").select("id, name, description, is_system").order("name"),
    supabase.from("artifact_bucket_stats").select("*"),
    artifactQuery,
    supabase.from("clients").select("id, name").order("name"),
  ]);

  const statsByBucket = new Map((stats ?? []).map((s) => [s.bucket_id, s]));
  const totals = (stats ?? []).reduce(
    (acc, s) => ({
      objects: acc.objects + Number(s.object_count),
      versions: acc.versions + Number(s.version_count),
      bytes: acc.bytes + Number(s.total_bytes),
    }),
    { objects: 0, versions: 0, bytes: 0 }
  );
  const bucketList = buckets ?? [];
  const items = (artifacts ?? []) as unknown as ArtifactListItem[];
  const isAdmin = org ? ADMIN_ROLES.has(org.role) : false;
  const canUpload = org ? org.role !== "viewer" : false;

  return (
    <div>
      <PageHeader
        title="Artifacts"
        description="One versioned home for every file MDS produces or receives — contracts, payroll registers, client uploads, pipeline exports, reports, scripts, and backups."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Buckets" value={bucketList.length} />
        <StatCard
          label="Artifacts"
          value={totals.objects}
          hint={`${totals.versions} version${totals.versions === 1 ? "" : "s"} stored`}
        />
        <StatCard label="Storage used" value={formatBytes(totals.bytes)} tone="brand" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buckets</CardTitle>
              <CardDescription>Named stores, one per kind of MDS work. System buckets are created for every workspace.</CardDescription>
            </CardHeader>
            <ul className="grid divide-border sm:grid-cols-2">
              {bucketList.map((bucket) => {
                const s = statsByBucket.get(bucket.id);
                return (
                  <li key={bucket.id} className="border-b border-border sm:odd:border-r">
                    <Link href={`/artifacts/${bucket.name}`} className="block px-5 py-3 hover:bg-surface-2">
                      <div className="flex items-center gap-2">
                        <span aria-hidden="true">🗄</span>
                        <span className="font-mono text-sm font-medium text-foreground">{bucket.name}</span>
                        {!bucket.is_system && <Badge tone="brand">custom</Badge>}
                      </div>
                      {bucket.description && <p className="mt-1 line-clamp-2 text-xs text-muted">{bucket.description}</p>}
                      <p className="mt-1.5 text-xs text-muted">
                        {Number(s?.object_count ?? 0)} artifacts · {formatBytes(Number(s?.total_bytes ?? 0))}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>{search ? `Results for “${search}”` : "Recent uploads"}</CardTitle>
              <form className="flex gap-2" action="/artifacts">
                <Input name="q" defaultValue={search} placeholder="Search keys, descriptions, tags" className="h-8 w-56" />
                <Button type="submit" size="sm" variant="secondary">
                  Search
                </Button>
              </form>
            </CardHeader>
            <CardContent className="p-0">
              {items.length > 0 ? (
                <ArtifactTable items={items} />
              ) : (
                <div className="p-5">
                  <EmptyState
                    icon="🗄"
                    title={search ? "No matching artifacts" : "No artifacts yet"}
                    description={
                      search
                        ? "Try a different key fragment or tag."
                        : "Upload a contract, a payroll register, or a pipeline export to get started."
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {canUpload && bucketList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upload an artifact</CardTitle>
              </CardHeader>
              <CardContent>
                <UploadArtifactForm
                  buckets={bucketList.map(({ id, name }) => ({ id, name }))}
                  clients={clients ?? []}
                />
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>New bucket</CardTitle>
              </CardHeader>
              <CardContent>
                <CreateBucketForm />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Automate it</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted">
              <p>
                Scripts, pipelines, and agents can manage artifacts through <code className="text-xs">/api/v1/artifacts</code>{" "}
                with an{" "}
                <Link href="/api-keys" className="text-brand hover:underline">
                  API key
                </Link>
                .
              </p>
              <pre className="overflow-x-auto rounded-md bg-surface-2 p-3 text-[11px] leading-relaxed text-foreground">
{`curl -H "Authorization: Bearer $CPSM_KEY" \\
  $APP/api/v1/artifacts/buckets`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
