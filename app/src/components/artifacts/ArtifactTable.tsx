import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { fileNameFromKey, formatBytes } from "@/lib/artifacts/keys";

export interface ArtifactListItem {
  id: string;
  key: string;
  version: number;
  size_bytes: number;
  tags: string[];
  created_at: string;
  artifact_buckets: { name: string } | null;
  clients: { name: string } | null;
}

/** Shared list for the overview, bucket browser, and a client's Artifacts tab. */
export function ArtifactTable({
  items,
  showBucket = true,
  showClient = true,
  /** Strip this folder prefix from displayed keys (bucket browser). */
  prefix = "",
}: {
  items: ArtifactListItem[];
  showBucket?: boolean;
  showClient?: boolean;
  prefix?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-5 py-2 font-medium">Key</th>
            {showBucket && <th className="px-3 py-2 font-medium">Bucket</th>}
            <th className="px-3 py-2 font-medium">Version</th>
            <th className="px-3 py-2 font-medium">Size</th>
            {showClient && <th className="px-3 py-2 font-medium">Client</th>}
            <th className="px-5 py-2 text-right font-medium">Uploaded</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => {
            const bucket = item.artifact_buckets?.name ?? "";
            const label = prefix && item.key.startsWith(prefix) ? item.key.slice(prefix.length) : item.key;
            return (
              <tr key={item.id}>
                <td className="max-w-xs px-5 py-2.5">
                  <Link
                    href={`/artifacts/${bucket}/${item.id}`}
                    className="block truncate font-medium text-foreground hover:text-brand"
                    title={item.key}
                  >
                    <span aria-hidden="true" className="mr-1.5 text-muted">
                      📄
                    </span>
                    {label || fileNameFromKey(item.key)}
                  </Link>
                  {item.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag} className="px-1.5 py-0 text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </td>
                {showBucket && (
                  <td className="px-3 py-2.5">
                    <Link href={`/artifacts/${bucket}`} className="font-mono text-xs text-muted hover:text-brand">
                      {bucket}
                    </Link>
                  </td>
                )}
                <td className="px-3 py-2.5 text-muted">v{item.version}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-muted">{formatBytes(item.size_bytes)}</td>
                {showClient && <td className="px-3 py-2.5 text-muted">{item.clients?.name ?? "—"}</td>}
                <td className="whitespace-nowrap px-5 py-2.5 text-right text-xs text-muted">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export const ARTIFACT_LIST_SELECT =
  "id, key, version, size_bytes, tags, created_at, artifact_buckets ( name ), clients ( name )";
