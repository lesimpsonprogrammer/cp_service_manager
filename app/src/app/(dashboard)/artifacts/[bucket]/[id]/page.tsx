import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org/getCurrentOrg";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { UploadArtifactForm } from "@/components/artifacts/UploadArtifactForm";
import { DeleteArtifactButtons, ShareLinkPanel } from "@/components/artifacts/ArtifactActionButtons";
import { fileNameFromKey, formatBytes } from "@/lib/artifacts/keys";

export default async function ArtifactDetailPage({ params }: { params: Promise<{ bucket: string; id: string }> }) {
  const { bucket: bucketName, id } = await params;
  const org = await getCurrentOrg();
  const supabase = await createClient();

  const { data: artifact } = await supabase
    .from("artifacts")
    .select("*, artifact_buckets ( id, name ), clients ( id, name )")
    .eq("id", id)
    .maybeSingle();
  const bucket = artifact?.artifact_buckets as { id: string; name: string } | null | undefined;
  if (!artifact || !bucket || bucket.name !== bucketName || artifact.status !== "available") notFound();
  const client = artifact.clients as { id: string; name: string } | null;

  const [{ data: versions }, { data: clients }] = await Promise.all([
    supabase
      .from("artifacts")
      .select("id, version, size_bytes, checksum_sha256, uploaded_by, created_at, is_latest")
      .eq("bucket_id", bucket.id)
      .eq("key", artifact.key)
      .eq("status", "available")
      .order("version", { ascending: false }),
    supabase.from("clients").select("id, name").order("name"),
  ]);
  const versionList = versions ?? [];

  const uploaderIds = [...new Set(versionList.map((v) => v.uploaded_by).filter((v): v is string => Boolean(v)))];
  const { data: profiles } = uploaderIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", uploaderIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const uploaderName = new Map((profiles ?? []).map((p) => [p.id, p.full_name || "Team member"]));

  const canEdit = org ? org.role !== "viewer" : false;
  const folder = artifact.key.includes("/") ? artifact.key.slice(0, artifact.key.lastIndexOf("/") + 1) : "";

  const details: [string, React.ReactNode][] = [
    ["Bucket", <Link key="b" href={`/artifacts/${bucket.name}`} className="font-mono text-brand hover:underline">{bucket.name}</Link>],
    ["Key", <code key="k" className="break-all text-xs">{artifact.key}</code>],
    ["Version", <span key="v">v{artifact.version}{artifact.is_latest ? " (latest)" : ""}</span>],
    ["Size", formatBytes(artifact.size_bytes)],
    ["Content type", <code key="c" className="text-xs">{artifact.content_type}</code>],
    ["SHA-256", artifact.checksum_sha256 ? <code key="s" className="break-all text-xs">{artifact.checksum_sha256}</code> : "—"],
    ["Client", client ? <Link key="cl" href={`/clients/${client.id}/artifacts`} className="text-brand hover:underline">{client.name}</Link> : "—"],
    ["Uploaded", `${new Date(artifact.created_at).toLocaleString()} by ${artifact.uploaded_by ? uploaderName.get(artifact.uploaded_by) ?? "Team member" : "API"}`],
  ];

  return (
    <div>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            <Link href="/artifacts" className="text-muted hover:text-brand">
              Artifacts
            </Link>
            <span className="text-muted">/</span>
            <Link
              href={folder ? `/artifacts/${bucket.name}?prefix=${encodeURIComponent(folder)}` : `/artifacts/${bucket.name}`}
              className="font-mono text-muted hover:text-brand"
            >
              {bucket.name}
            </Link>
            <span className="text-muted">/</span>
            <span className="break-all">{fileNameFromKey(artifact.key)}</span>
          </span>
        }
        description={artifact.description || undefined}
        action={
          <a href={`/api/artifacts/${artifact.id}/download`}>
            <Button>Download</Button>
          </a>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[140px_1fr]">
                {details.map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-muted">{label}</dt>
                    <dd className="min-w-0 text-foreground">{value}</dd>
                  </div>
                ))}
                {artifact.tags.length > 0 && (
                  <div className="contents">
                    <dt className="text-muted">Tags</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {artifact.tags.map((tag) => (
                        <Link key={tag} href={`/artifacts?q=${encodeURIComponent(tag)}`}>
                          <Badge tone="brand">{tag}</Badge>
                        </Link>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Versions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {versionList.map((v) => (
                  <li
                    key={v.id}
                    className={`flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-sm ${v.id === artifact.id ? "bg-brand/5" : ""}`}
                  >
                    <Link href={`/artifacts/${bucket.name}/${v.id}`} className="font-medium text-foreground hover:text-brand">
                      v{v.version}
                      {v.is_latest && (
                        <Badge tone="success" className="ml-2">
                          latest
                        </Badge>
                      )}
                    </Link>
                    <span className="text-xs text-muted">
                      {formatBytes(v.size_bytes)} · {new Date(v.created_at).toLocaleString()} ·{" "}
                      {v.uploaded_by ? uploaderName.get(v.uploaded_by) ?? "Team member" : "API"}
                    </span>
                    <a href={`/api/artifacts/${v.id}/download`} className="text-xs text-brand hover:underline">
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {canEdit && (
            <Card>
              <CardHeader>
                <CardTitle>Upload a new version</CardTitle>
              </CardHeader>
              <CardContent>
                <UploadArtifactForm
                  buckets={[{ id: bucket.id, name: bucket.name }]}
                  clients={clients ?? []}
                  fixedKey={artifact.key}
                  defaults={{ description: artifact.description, tags: artifact.tags, clientId: artifact.client_id }}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {canEdit && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Share link</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted">
                  A temporary, signed download link for this version — no CPSM login needed. Treat it like the file
                  itself.
                </p>
                <ShareLinkPanel artifactId={artifact.id} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delete</CardTitle>
              </CardHeader>
              <CardContent>
                <DeleteArtifactButtons
                  artifactId={artifact.id}
                  bucketId={bucket.id}
                  bucketName={bucket.name}
                  artifactKey={artifact.key}
                  version={artifact.version}
                  versionCount={versionList.length}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
