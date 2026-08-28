"use client";

import { useTransition } from "react";
import { revokeApiKey } from "@/app/(dashboard)/api-keys/actions";
import { Button } from "@/components/ui/Button";

export function RevokeApiKeyButton({ apiKeyId }: { apiKeyId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Revoke this API key? Requests using it will start failing immediately.")) return;
        startTransition(() => revokeApiKey(apiKeyId));
      }}
    >
      {pending ? "Revoking…" : "Revoke"}
    </Button>
  );
}
