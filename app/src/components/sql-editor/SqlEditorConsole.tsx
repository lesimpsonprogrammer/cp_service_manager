"use client";

import { useMemo, useState, useTransition } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { runSqlEditorQuery, type QueryLogEntry } from "@/app/(dashboard)/sql-editor/actions";

const SCHEMA_QUERY = `select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position`;

const ROW_LIMIT = 500;

function hasExplicitLimit(query: string) {
  return /\blimit\s+\d+/i.test(query);
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const columns = Object.keys(rows[0]!);
  const escape = (value: unknown) => {
    if (value === null || value === undefined) return "";
    const str = typeof value === "object" ? JSON.stringify(value) : String(value);
    return `"${str.replace(/"/g, '""')}"`;
  };
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((c) => escape(row[c])).join(","));
  }
  return lines.join("\n");
}

function downloadCsv(rows: Record<string, unknown>[]) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sql-editor-results-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function SqlEditorConsole({
  recentQueries,
  clientId = null,
  clientName = null,
}: {
  recentQueries: QueryLogEntry[];
  clientId?: string | null;
  clientName?: string | null;
}) {
  const [query, setQuery] = useState("select * from clients limit 25");
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const columns = useMemo(() => (rows && rows.length > 0 ? Object.keys(rows[0]!) : []), [rows]);
  const unbounded = !hasExplicitLimit(query);

  function run(q: string) {
    setQuery(q);
    startTransition(async () => {
      const result = await runSqlEditorQuery(q, clientId);
      setRows(result.rows);
      setError(result.error);
      setDurationMs(result.durationMs);
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Query</CardTitle>
            <CardDescription>
              SELECT and CTEs only. DDL/DML (DROP, DELETE, UPDATE, ALTER, INSERT, …) is blocked
              server-side, not just in this UI.
            </CardDescription>
          </div>
          <button
            type="button"
            onClick={() => run(SCHEMA_QUERY)}
            disabled={isPending}
            className="shrink-0 rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:border-border-strong hover:text-foreground disabled:opacity-50"
          >
            Browse schema
          </button>
        </CardHeader>
        <CardContent>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            spellCheck={false}
            rows={8}
            className="w-full resize-y rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-foreground focus:border-brand focus:outline-none"
            placeholder="select * from clients limit 25"
          />
          {unbounded && (
            <p className="mt-2 text-xs text-warning">
              No LIMIT in this query — results are capped at {ROW_LIMIT} rows automatically.
            </p>
          )}
          {clientName && (
            <p className="mt-2 text-xs text-brand">Scoped to client: {clientName}</p>
          )}
        </CardContent>
        <CardFooter>
          <span className="text-xs text-muted">
            Runs as you — row level security still applies. 5s timeout, {ROW_LIMIT}-row cap.
          </span>
          <button
            type="button"
            onClick={() => run(query)}
            disabled={isPending || !query.trim()}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50"
          >
            {isPending ? "Running…" : "Run query"}
          </button>
        </CardFooter>
      </Card>

      {error && (
        <Card className="border-danger/40 bg-danger/5">
          <CardContent>
            <p className="text-sm font-medium text-danger">Query failed</p>
            <p className="mt-1 font-mono text-xs text-danger/90">{error}</p>
          </CardContent>
        </Card>
      )}

      {rows && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                {rows.length} row{rows.length === 1 ? "" : "s"}
                {durationMs !== null && ` · ${durationMs}ms`}
              </CardDescription>
            </div>
            {rows.length > 0 && (
              <button
                type="button"
                onClick={() => downloadCsv(rows)}
                className="shrink-0 rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:border-border-strong hover:text-foreground"
              >
                Download CSV
              </button>
            )}
          </CardHeader>
          {rows.length === 0 ? (
            <CardContent>
              <p className="text-sm text-muted">No rows returned.</p>
            </CardContent>
          ) : (
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    {columns.map((c) => (
                      <th key={c} className="whitespace-nowrap px-4 py-2 font-medium">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row, i) => (
                    <tr key={i}>
                      {columns.map((c) => (
                        <td key={c} className="whitespace-nowrap px-4 py-2 font-mono text-xs text-foreground">
                          {row[c] === null || row[c] === undefined
                            ? <span className="text-muted">null</span>
                            : typeof row[c] === "object"
                              ? JSON.stringify(row[c])
                              : String(row[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent queries</CardTitle>
          <CardDescription>Every run in this org — who, when, and its outcome.</CardDescription>
        </CardHeader>
        {recentQueries.length === 0 ? (
          <CardContent>
            <EmptyState icon="🛢" title="No queries yet" description="Runs you make will show up here." />
          </CardContent>
        ) : (
          <div className="divide-y divide-border">
            {recentQueries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => run(entry.query)}
                className="flex w-full items-start justify-between gap-4 px-5 py-3 text-left hover:bg-surface-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-foreground">{entry.query}</p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(entry.created_at).toLocaleString()}
                    {entry.duration_ms !== null && ` · ${entry.duration_ms}ms`}
                    {entry.row_count !== null && ` · ${entry.row_count} rows`}
                  </p>
                </div>
                <Badge tone={entry.status === "success" ? "success" : "danger"}>{entry.status}</Badge>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
