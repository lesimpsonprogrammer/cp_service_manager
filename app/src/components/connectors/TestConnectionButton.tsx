"use client";

import { useState, useTransition } from "react";
import { testDataSourceConnection } from "@/app/(dashboard)/data-sources/actions";
import { Button } from "@/components/ui/Button";
import type { ConnectionTestResult } from "@/lib/connectors/types";

export function TestConnectionButton({ dataSourceId }: { dataSourceId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ConnectionTestResult | null>(null);

  return (
    <div>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setResult(await testDataSourceConnection(dataSourceId));
          })
        }
      >
        {pending ? "Testing…" : "Test connection"}
      </Button>

      {result && (
        <p className={`mt-2 text-sm ${result.ok ? "text-success" : "text-danger"}`}>
          {result.message}
          {result.fieldsDetected && (
            <span className="block text-xs text-muted">Fields: {result.fieldsDetected.join(", ")}</span>
          )}
        </p>
      )}
    </div>
  );
}
