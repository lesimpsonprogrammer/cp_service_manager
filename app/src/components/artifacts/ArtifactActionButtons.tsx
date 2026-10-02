"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { SHARE_LINK_TTLS } from "@/lib/artifacts/keys";
import {
  createShareLink,
  deleteAllVersions,
  deleteBucket,
  deleteVersion,
} from "@/app/(dashboard)/artifacts/actions";

function ErrorText({ error }: { error: string | null }) {
  return error ? <p className="mt-2 text-xs text-danger">{error}</p> : null;
}

export function DeleteBucketButton({ bucketId, bucketName }: { bucketId: string; bucketName: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Delete the empty bucket "${bucketName}"?`)) return;
          startTransition(async () => {
            const result = await deleteBucket(bucketId);
            if (result && !result.ok) setError(result.error);
          });
        }}
      >
        {pending ? "Deleting…" : "Delete bucket"}
      </Button>
      <ErrorText error={error} />
    </div>
  );
}

export function DeleteArtifactButtons({
  artifactId,
  bucketId,
  bucketName,
  artifactKey,
  version,
  versionCount,
}: {
  artifactId: string;
  bucketId: string;
  bucketName: string;
  artifactKey: string;
  version: number;
  versionCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(message: string, action: () => Promise<{ ok: boolean; error?: string } | undefined>) {
    if (!confirm(message)) return;
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result && !result.ok) setError(result.error ?? "Delete failed.");
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() =>
            run(`Delete version ${version} of ${artifactKey}? This can't be undone.`, () =>
              deleteVersion(artifactId, bucketName)
            )
          }
        >
          Delete v{version}
        </Button>
        {versionCount > 1 && (
          <Button
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={() =>
              run(`Delete all ${versionCount} versions of ${artifactKey}? This can't be undone.`, () =>
                deleteAllVersions(bucketId, artifactKey, bucketName)
              )
            }
          >
            Delete all versions
          </Button>
        )}
      </div>
      <ErrorText error={error} />
    </div>
  );
}

export function ShareLinkPanel({ artifactId }: { artifactId: string }) {
  const [pending, startTransition] = useTransition();
  const [ttl, setTtl] = useState<number>(SHARE_LINK_TTLS[0].seconds);
  const [link, setLink] = useState<{ url: string; expiresAt: Date } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={ttl} onChange={(e) => setTtl(Number(e.target.value))} className="w-auto" disabled={pending}>
          {SHARE_LINK_TTLS.map((option) => (
            <option key={option.seconds} value={option.seconds}>
              Expires in {option.label}
            </option>
          ))}
        </Select>
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => {
            setError(null);
            setCopied(false);
            startTransition(async () => {
              const result = await createShareLink(artifactId, ttl);
              if (result.ok) setLink({ url: result.value, expiresAt: new Date(Date.now() + ttl * 1000) });
              else setError(result.error);
            });
          }}
        >
          {pending ? "Generating…" : "Generate link"}
        </Button>
      </div>
      {link && (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <input
              readOnly
              value={link.url}
              onFocus={(e) => e.currentTarget.select()}
              className="h-8 min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-2 font-mono text-xs text-foreground"
            />
            <Button
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(link.url);
                setCopied(true);
              }}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-muted">
            Anyone with this link can download the file until {link.expiresAt.toLocaleString()}.
          </p>
        </div>
      )}
      <ErrorText error={error} />
    </div>
  );
}
