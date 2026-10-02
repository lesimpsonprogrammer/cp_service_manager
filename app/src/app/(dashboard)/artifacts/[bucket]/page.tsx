import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArtifactTable, ARTIFACT_LIST_SELECT, type ArtifactListItem } from "@/components/artifacts/ArtifactTable";
import { UploadArtifactForm } from "@/components/artifacts/UploadArtifactForm";
import { DeleteBucketButton } from "@/components/artifacts/ArtifactActionButtons";
import { formatBytes, groupByFolder, normalizeArtifactPrefix } from "@/lib/artifacts/keys";

const ADMIN_ROLES = new Set(["owner", "admin", "sys_admin"]);
const MAX_LISTED = 1000;

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export default async function BucketPage({
  params,
  searchParams,
}: {
  params: Promise<{ bucket: string }>;
  searchParams: Promise<{ prefix?: string }>;
}) {
  const { bucket: bucketName } = await params;
  const prefix = normalizeArtifactPrefix((await searchParams).prefix ?? "");
  const org = await getCurrentOrg();
  const supabase = await createClient();

  const { data: bucket } = await supabase
    .from("artifact_buckets")
    .select("id, name, description, is_system")
    .eq("name", bucketName)
    .maybeSingle();
  if (!bucket) notFound();

  let objectQuery = supabase
    .from("artifacts")
    .select(ARTIFACT_LIST_SELECT)
    .eq("bucket_id", bucket.id)
    .eq("is_latest", true)
    .order("key")
    .limit(MAX_LISTED);
  if (prefix) objectQuery = objectQuery.like("key", `${escapeLike(prefix)}%`);

  const [{ data: objects }, { data: stats }, { data: clients }] = await Promise.all([
    objectQuery,
    supabase.from("artifact_bucket_stats").select("*").eq("bucket_id", bucket.id).maybeSingle(),
    supabase.from("clients").select("id, name").order("name"),
  ]);

  const items = (objects ?? []) as unknown as ArtifactListItem[];
  const { folders, files } = groupByFolder(items, prefix);
  const isAdmin = org ? ADMIN_ROLES.has(org.role) : false;
  const canUpload = org ? org.role !== "viewer" : false;
  const objectCount = Number(stats?.object_count ?? 0);

  const crumbs = prefix
    .split("/")
    .filter(Boolean)
    .map((segment, index, all) => ({ segment, prefix: `${all.slice(0, index + 1).join("/")}/` }));

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Link href="/artifacts" className="text-muted hover:text-brand">
              Artifacts
            </Link>
            <span className="text-muted">/</span>
            <span className="font-mono">{bucket.name}</span>
            {bucket.is_system ? <Badge>system</Badge> : <Badge tone="brand">custom</Badge>}
          </span>
        }
        description={bucket.description || undefined}
        action={
          isAdmin && !bucket.is_system && objectCount === 0 && Number(stats?.version_count ?? 0) === 0 ? (
            <DeleteBucketButton bucketId={bucket.id} bucketName={bucket.name} />
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="min-w-0">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <nav className="flex flex-wrap items-center gap-1 font-mono text-xs">
              <Link href={`/artifacts/${bucket.name}`} className="text-brand hover:underline">
                {bucket.name}
              </Link>
              {crumbs.map((crumb) => (
                <span key={crumb.prefix} className="flex items-center gap-1">
                  <span className="text-muted">/</span>
                  <Link
                    href={`/artifacts/${bucket.name}?prefix=${encodeURIComponent(crumb.prefix)}`}
                    className="text-brand hover:underline"
                  >
                    {crumb.segment}
                  </Link>
                </span>
              ))}
            </nav>
            <span className="text-xs text-muted">
              {objectCount} artifacts · {Number(stats?.version_count ?? 0)} versions ·{" "}
              {formatBytes(Number(stats?.total_bytes ?? 0))}
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {folders.length > 0 && (
              <ul className="divide-y divide-border border-b border-border">
                {folders.map((folder) => (
                  <li key={folder.prefix}>
                    <Link
                      href={`/artifacts/${bucket.name}?prefix=${encodeURIComponent(folder.prefix)}`}
                      className="flex items-center justify-between px-5 py-2.5 text-sm hover:bg-surface-2"
                    >
                      <span className="font-medium text-foreground">
                        <span aria-hidden="true" className="mr-1.5">
                          📁
                        </span>
                        {folder.name}/
                      </span>
                      <span className="text-xs text-muted">{folder.count} items</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {files.length > 0 && <ArtifactTable items={files} showBucket={false} prefix={prefix} />}
            {folders.length === 0 && files.length === 0 && (
              <div className="p-5">
                <EmptyState
                  icon="🗄"
                  title={prefix ? "This folder is empty" : "This bucket is empty"}
                  description="Upload a file to add the first artifact."
                />
              </div>
            )}
            {items.length >= MAX_LISTED && (
              <p className="border-t border-border px-5 py-2 text-xs text-muted">
                Showing the first {MAX_LISTED} keys — open a folder to narrow the list.
              </p>
            )}
          </CardContent>
        </Card>

        {canUpload && (
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Upload to {bucket.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <UploadArtifactForm
                buckets={[{ id: bucket.id, name: bucket.name }]}
                clients={clients ?? []}
                prefix={prefix}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
