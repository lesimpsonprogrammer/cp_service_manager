"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { ARTIFACTS_STORAGE_BUCKET, formatBytes, normalizeArtifactKey } from "@/lib/artifacts/keys";
import { finalizeUpload, prepareUpload } from "@/app/(dashboard)/artifacts/actions";

// Hashing reads the whole file into memory — skip it for very large files.
const MAX_CHECKSUM_BYTES = 200 * 1024 * 1024;

type Phase = "idle" | "hashing" | "preparing" | "uploading" | "finalizing";

const PHASE_LABEL: Record<Phase, string> = {
  idle: "Upload",
  hashing: "Computing checksum…",
  preparing: "Preparing…",
  uploading: "Uploading…",
  finalizing: "Finishing…",
};

async function sha256Hex(file: File): Promise<string | null> {
  if (file.size > MAX_CHECKSUM_BYTES || !globalThis.crypto?.subtle) return null;
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function UploadArtifactForm({
  buckets,
  clients,
  defaultBucketId,
  prefix = "",
  fixedKey,
  defaults,
}: {
  buckets: { id: string; name: string }[];
  clients: { id: string; name: string }[];
  defaultBucketId?: string;
  /** Folder the new key starts in (bucket browser's current prefix). */
  prefix?: string;
  /** Set when uploading a new version of an existing key. */
  fixedKey?: string;
  defaults?: { description?: string; tags?: string[]; clientId?: string | null };
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [bucketId, setBucketId] = useState(defaultBucketId ?? buckets[0]?.id ?? "");
  const [key, setKey] = useState(fixedKey ?? prefix);
  const [keyEdited, setKeyEdited] = useState(Boolean(fixedKey));
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const busy = phase !== "idle";
  const bucketName = buckets.find((b) => b.id === bucketId)?.name ?? "";

  function onFileChange(next: File | null) {
    setFile(next);
    setError(null);
    if (next && !keyEdited) setKey(`${prefix}${next.name}`);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return setError("Choose a file to upload.");
    const normalized = normalizeArtifactKey(key);
    if (!normalized.ok) return setError(normalized.error);

    const form = new FormData(event.currentTarget);
    setError(null);

    try {
      setPhase("hashing");
      const checksum = await sha256Hex(file);

      setPhase("preparing");
      const prepared = await prepareUpload({
        bucketId,
        key: normalized.value,
        contentType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        checksumSha256: checksum,
        description: String(form.get("description") ?? ""),
        tags: String(form.get("tags") ?? ""),
        clientId: String(form.get("client_id") ?? "") || null,
      });
      if (!prepared.ok) throw new Error(prepared.error);

      setPhase("uploading");
      const { error: uploadError } = await createClient()
        .storage.from(ARTIFACTS_STORAGE_BUCKET)
        .uploadToSignedUrl(prepared.value.upload.path, prepared.value.upload.token, file, {
          contentType: file.type || "application/octet-stream",
        });
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      setPhase("finalizing");
      const finalized = await finalizeUpload(prepared.value.artifact.id);
      if (!finalized.ok) throw new Error(finalized.error);

      router.push(`/artifacts/${bucketName}/${finalized.value.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setPhase("idle");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="artifact-file">File</Label>
        <input
          id="artifact-file"
          type="file"
          disabled={busy}
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:border-border-strong"
        />
        {file && (
          <p className="mt-1 text-xs text-muted">
            {file.name} · {formatBytes(file.size)}
            {file.size > MAX_CHECKSUM_BYTES && " · too large to checksum in the browser"}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <div>
          <Label htmlFor="artifact-bucket">Bucket</Label>
          <Select
            id="artifact-bucket"
            value={bucketId}
            disabled={busy || Boolean(fixedKey) || buckets.length <= 1}
            onChange={(e) => setBucketId(e.target.value)}
          >
            {buckets.map((bucket) => (
              <option key={bucket.id} value={bucket.id}>
                {bucket.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="artifact-key">Key (path)</Label>
          <Input
            id="artifact-key"
            value={key}
            disabled={busy || Boolean(fixedKey)}
            onChange={(e) => {
              setKey(e.target.value);
              setKeyEdited(true);
            }}
            placeholder="acme/2026/q3-payroll-register.xlsx"
            className="font-mono text-xs"
          />
          <p className="mt-1 text-xs text-muted">
            Use slashes for folders. Uploading to an existing key adds a new version.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="artifact-client">Client (optional)</Label>
          <Select id="artifact-client" name="client_id" defaultValue={defaults?.clientId ?? ""} disabled={busy}>
            <option value="">— None —</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="artifact-tags">Tags</Label>
          <Input
            id="artifact-tags"
            name="tags"
            defaultValue={defaults?.tags?.join(", ")}
            disabled={busy}
            placeholder="q3, year-end, signed"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="artifact-description">Description</Label>
        <Textarea
          id="artifact-description"
          name="description"
          rows={2}
          defaultValue={defaults?.description}
          disabled={busy}
          placeholder="What this file is and where it came from."
        />
      </div>

      {error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <Button type="submit" disabled={busy || !file || !bucketId}>
        {PHASE_LABEL[phase]}
      </Button>
    </form>
  );
}
