"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  browseDataStudioTable,
  getRecentMutationLog,
  mutateDataStudioRow,
  runSqlEditorQuery,
  type DataStudioClient,
  type DataStudioColumn,
  type DataStudioTable,
  type MutationLogEntry,
  type QueryLogEntry,
} from "@/app/(dashboard)/sql-editor/actions";

const ROW_LIMIT = 500;

type Mode = "data" | "sql";
type EditorMode = "insert" | "update" | null;

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const columns = Object.keys(rows[0]!);
  const escape = (value: unknown) => {
    if (value === null || value === undefined) return "";
    const str = typeof value === "object" ? JSON.stringify(value) : String(value);
    return `"${str.replace(/"/g, '""')}"`;
  };
  const lines = [columns.join(",")];
  for (const row of rows) lines.push(columns.map((column) => escape(row[column])).join(","));
  return lines.join("\n");
}

function downloadCsv(rows: Record<string, unknown>[], tableName: string) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${tableName}-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function formatCell(value: unknown) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function parseColumnValue(column: DataStudioColumn, raw: string, mode: Exclude<EditorMode, null>) {
  if (raw === "") {
    if (mode === "insert") return undefined;
    return column.nullable ? null : "";
  }

  if (column.dataType === "boolean") {
    if (raw === "true") return true;
    if (raw === "false") return false;
    throw new Error(`${column.name} must be true or false.`);
  }

  if (["smallint", "integer", "bigint", "numeric", "real", "double precision", "decimal"].includes(column.dataType)) {
    const numeric = Number(raw);
    if (Number.isNaN(numeric)) throw new Error(`${column.name} must be numeric.`);
    return numeric;
  }

  if (column.dataType === "json" || column.dataType === "jsonb" || column.dataType === "ARRAY") {
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error(`${column.name} must contain valid JSON${column.dataType === "ARRAY" ? " array" : ""}.`);
    }
  }

  return raw;
}

export function DataStudioConsole({
  tables,
  clients,
  recentQueries,
  initialMutationLog,
}: {
  tables: DataStudioTable[];
  clients: DataStudioClient[];
  recentQueries: QueryLogEntry[];
  initialMutationLog: MutationLogEntry[];
}) {
  const [mode, setMode] = useState<Mode>("data");
  const [selectedTableName, setSelectedTableName] = useState(tables[0]?.tableName ?? "");
  const [clientId, setClientId] = useState<string>("");
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [mutationLog, setMutationLog] = useState(initialMutationLog);
  const [query, setQuery] = useState("select * from clients limit 25");
  const [queryRows, setQueryRows] = useState<Record<string, unknown>[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryDurationMs, setQueryDurationMs] = useState<number | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy SQL");
  const [isPending, startTransition] = useTransition();

  const selectedTable = useMemo(
    () => tables.find((table) => table.tableName === selectedTableName) ?? null,
    [tables, selectedTableName],
  );

  const columns = useMemo(() => (rows && rows.length ? Object.keys(rows[0]!) : []), [rows]);
  const queryColumns = useMemo(
    () => (queryRows && queryRows.length ? Object.keys(queryRows[0]!) : []),
    [queryRows],
  );

  const writableColumns = useMemo(() => {
    if (!selectedTable || !editorMode) return [];
    return selectedTable.columns.filter((column) => {
      if (column.identity || column.generated) return false;
      if (selectedTable.protectedColumns.includes(column.name)) return false;
      if (column.name === selectedTable.orgScopeColumn) return false;
      if (editorMode === "update" && column.name === selectedTable.clientScopeColumn) return false;
      if (editorMode === "insert" && clientId && column.name === selectedTable.clientScopeColumn) return false;
      return true;
    });
  }, [selectedTable, editorMode, clientId]);

  const canCreate = Boolean(
    selectedTable?.allowInsert &&
      (!selectedTable.clientScopeColumn ||
        selectedTable.primaryKeyColumns.includes(selectedTable.clientScopeColumn) ||
        clientId),
  );

  function resetEditor() {
    setEditorMode(null);
    setSelectedRow(null);
    setFormValues({});
  }

  function loadRows() {
    if (!selectedTableName) return;
    resetEditor();
    setError(null);
    startTransition(async () => {
      const result = await browseDataStudioTable(selectedTableName, clientId || null);
      setRows(result.rows);
      setError(result.error);
      setDurationMs(result.durationMs);
    });
  }

  function beginInsert() {
    if (!selectedTable || !canCreate) return;
    setSelectedRow(null);
    setEditorMode("insert");
    const next: Record<string, string> = {};
    for (const column of selectedTable.columns) next[column.name] = "";
    setFormValues(next);
  }

  function beginUpdate(row: Record<string, unknown>) {
    if (!selectedTable?.allowUpdate) return;
    setSelectedRow(row);
    setEditorMode("update");
    const next: Record<string, string> = {};
    for (const column of selectedTable.columns) next[column.name] = formValue(row[column.name]);
    setFormValues(next);
  }

  function primaryKeyFor(row: Record<string, unknown>) {
    const key: Record<string, unknown> = {};
    for (const column of selectedTable?.primaryKeyColumns ?? []) key[column] = row[column];
    return key;
  }

  function saveRecord() {
    if (!selectedTable || !editorMode) return;
    setError(null);

    const values: Record<string, unknown> = {};
    try {
      for (const column of writableColumns) {
        const parsed = parseColumnValue(column, formValues[column.name] ?? "", editorMode);
        if (parsed !== undefined) values[column.name] = parsed;
      }
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "One or more values are invalid.");
      return;
    }

    const key = editorMode === "update" && selectedRow ? primaryKeyFor(selectedRow) : {};

    startTransition(async () => {
      const result = await mutateDataStudioRow({
        tableName: selectedTable.tableName,
        operation: editorMode,
        key,
        values,
        clientId: clientId || null,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      resetEditor();
      const [refreshedRows, refreshedLog] = await Promise.all([
        browseDataStudioTable(selectedTable.tableName, clientId || null),
        getRecentMutationLog(),
      ]);
      setRows(refreshedRows.rows);
      setDurationMs(refreshedRows.durationMs);
      setError(refreshedRows.error);
      setMutationLog(refreshedLog);
    });
  }

  function deleteRecord(row: Record<string, unknown>) {
    if (!selectedTable?.allowDelete) return;
    const confirmed = window.confirm(
      `Delete this row from ${selectedTable.label}? This action will be recorded in the Data Studio audit log.`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await mutateDataStudioRow({
        tableName: selectedTable.tableName,
        operation: "delete",
        key: primaryKeyFor(row),
        clientId: clientId || null,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      const [refreshedRows, refreshedLog] = await Promise.all([
        browseDataStudioTable(selectedTable.tableName, clientId || null),
        getRecentMutationLog(),
      ]);
      setRows(refreshedRows.rows);
      setDurationMs(refreshedRows.durationMs);
      setError(refreshedRows.error);
      setMutationLog(refreshedLog);
    });
  }

  function runQuery(nextQuery = query) {
    setQuery(nextQuery);
    setQueryError(null);
    startTransition(async () => {
      const result = await runSqlEditorQuery(nextQuery, clientId || null);
      setQueryRows(result.rows);
      setQueryError(result.error);
      setQueryDurationMs(result.durationMs);
    });
  }

  async function copySql() {
    if (!query.trim()) return;
    try {
      await navigator.clipboard.writeText(query);
      setCopyLabel("Copied ✓");
      window.setTimeout(() => setCopyLabel("Copy SQL"), 1600);
    } catch {
      setQueryError("Unable to copy SQL to the clipboard. Your browser may have blocked clipboard access.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("data")}
          className={`rounded-md border px-4 py-2 text-sm font-medium ${
            mode === "data" ? "border-brand bg-brand text-white" : "border-border text-muted hover:text-foreground"
          }`}
        >
          Data Editor
        </button>
        <button
          type="button"
          onClick={() => setMode("sql")}
          className={`rounded-md border px-4 py-2 text-sm font-medium ${
            mode === "sql" ? "border-brand bg-brand text-white" : "border-border text-muted hover:text-foreground"
          }`}
        >
          SQL Console
        </button>
        <Badge tone="neutral">PostgreSQL</Badge>
        <Badge tone="success">Read + Write</Badge>
      </div>

      {mode === "data" ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>PostgreSQL Explorer</CardTitle>
              <CardDescription>
                Browse approved production tables and perform controlled row-level inserts, updates, and deletes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto]">
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">Table</span>
                  <select
                    value={selectedTableName}
                    onChange={(event) => {
                      setSelectedTableName(event.target.value);
                      setClientId("");
                      setRows(null);
                      resetEditor();
                    }}
                    className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-foreground"
                  >
                    {tables.map((table) => (
                      <option key={table.tableName} value={table.tableName}>
                        {table.label} · {table.tableName}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">Scope</span>
                  <select
                    value={clientId}
                    disabled={!selectedTable?.clientScopeColumn}
                    onChange={(event) => {
                      setClientId(event.target.value);
                      setRows(null);
                      resetEditor();
                    }}
                    className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-foreground disabled:opacity-50"
                  >
                    <option value="">Organization-wide</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={loadRows}
                    disabled={isPending || !selectedTable}
                    className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {isPending ? "Working…" : "Load data"}
                  </button>
                  <button
                    type="button"
                    onClick={beginInsert}
                    disabled={isPending || !canCreate}
                    className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-40"
                    title={
                      selectedTable?.clientScopeColumn &&
                      !selectedTable.primaryKeyColumns.includes(selectedTable.clientScopeColumn) &&
                      !clientId
                        ? "Choose a client scope before creating a client-owned record."
                        : undefined
                    }
                  >
                    New record
                  </button>
                </div>
              </div>

              {selectedTable && (
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <Badge tone={selectedTable.allowInsert ? "success" : "neutral"}>INSERT {selectedTable.allowInsert ? "on" : "off"}</Badge>
                  <Badge tone={selectedTable.allowUpdate ? "success" : "neutral"}>UPDATE {selectedTable.allowUpdate ? "on" : "off"}</Badge>
                  <Badge tone={selectedTable.allowDelete ? "success" : "neutral"}>DELETE {selectedTable.allowDelete ? "on" : "off"}</Badge>
                  <Badge tone="neutral">PK: {selectedTable.primaryKeyColumns.join(", ")}</Badge>
                  <Badge tone="neutral">{selectedTable.columns.length} columns</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <Card className="border-danger/40 bg-danger/5">
              <CardContent>
                <p className="text-sm font-medium text-danger">Data Studio error</p>
                <p className="mt-1 font-mono text-xs text-danger/90">{error}</p>
              </CardContent>
            </Card>
          )}

          {editorMode && selectedTable && (
            <Card>
              <CardHeader>
                <CardTitle>{editorMode === "insert" ? `New ${selectedTable.label} record` : `Edit ${selectedTable.label} record`}</CardTitle>
                <CardDescription>
                  Scope and system identity columns are protected. PostgreSQL defaults are preserved when insert fields are left blank.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {writableColumns.map((column) => (
                    <label key={column.name} className="space-y-1 text-sm">
                      <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
                        {column.name}
                        <span className="normal-case font-normal">{column.dataType}</span>
                        {column.nullable && <span className="normal-case font-normal">nullable</span>}
                      </span>
                      {column.dataType === "json" || column.dataType === "jsonb" || column.dataType === "ARRAY" ? (
                        <textarea
                          rows={4}
                          value={formValues[column.name] ?? ""}
                          onChange={(event) => setFormValues((current) => ({ ...current, [column.name]: event.target.value }))}
                          className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground"
                        />
                      ) : column.dataType === "boolean" ? (
                        <select
                          value={formValues[column.name] ?? ""}
                          onChange={(event) => setFormValues((current) => ({ ...current, [column.name]: event.target.value }))}
                          className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-foreground"
                        >
                          <option value="">{editorMode === "insert" ? "Use default / blank" : "Blank"}</option>
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : (
                        <input
                          value={formValues[column.name] ?? ""}
                          onChange={(event) => setFormValues((current) => ({ ...current, [column.name]: event.target.value }))}
                          className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-foreground"
                        />
                      )}
                    </label>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <button
                  type="button"
                  onClick={resetEditor}
                  disabled={isPending}
                  className="rounded-md border border-border px-4 py-2 text-sm text-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveRecord}
                  disabled={isPending}
                  className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {isPending ? "Saving…" : editorMode === "insert" ? "Insert record" : "Save changes"}
                </button>
              </CardFooter>
            </Card>
          )}

          {rows && selectedTable && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>{selectedTable.label}</CardTitle>
                  <CardDescription>
                    {rows.length} row{rows.length === 1 ? "" : "s"}{durationMs !== null ? ` · ${durationMs}ms` : ""} · max 100 per load
                  </CardDescription>
                </div>
                {rows.length > 0 && (
                  <button
                    type="button"
                    onClick={() => downloadCsv(rows, selectedTable.tableName)}
                    className="rounded-md border border-border px-3 py-1.5 text-sm text-muted"
                  >
                    Export CSV
                  </button>
                )}
              </CardHeader>
              {rows.length === 0 ? (
                <CardContent>
                  <EmptyState icon="▦" title="No rows" description="No records matched the current scope." />
                </CardContent>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
                      <tr>
                        <th className="px-4 py-2">Actions</th>
                        {columns.map((column) => (
                          <th key={column} className="whitespace-nowrap px-4 py-2 font-medium">{column}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows.map((row, index) => (
                        <tr key={index} className="hover:bg-surface-2/60">
                          <td className="whitespace-nowrap px-4 py-2">
                            <div className="flex gap-2">
                              {selectedTable.allowUpdate && (
                                <button
                                  type="button"
                                  onClick={() => beginUpdate(row)}
                                  className="text-xs font-medium text-brand hover:underline"
                                >
                                  Edit
                                </button>
                              )}
                              {selectedTable.allowDelete && (
                                <button
                                  type="button"
                                  onClick={() => deleteRecord(row)}
                                  className="text-xs font-medium text-danger hover:underline"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                          {columns.map((column) => (
                            <td key={column} className="max-w-[320px] truncate whitespace-nowrap px-4 py-2 font-mono text-xs text-foreground" title={formatCell(row[column])}>
                              {row[column] === null || row[column] === undefined ? (
                                <span className="text-muted">null</span>
                              ) : (
                                formatCell(row[column])
                              )}
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
              <CardTitle>Write audit</CardTitle>
              <CardDescription>Immutable history of successful Data Studio inserts, updates, and deletes.</CardDescription>
            </CardHeader>
            {mutationLog.length === 0 ? (
              <CardContent>
                <EmptyState icon="↺" title="No writes yet" description="Data Studio mutations will appear here with before/after values." />
              </CardContent>
            ) : (
              <div className="divide-y divide-border">
                {mutationLog.map((entry) => (
                  <div key={entry.id} className="flex items-start justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-foreground">{entry.table_name}</p>
                      <p className="mt-1 text-xs text-muted">{new Date(entry.created_at).toLocaleString()}</p>
                    </div>
                    <Badge tone={entry.operation === "delete" ? "danger" : entry.operation === "update" ? "brand" : "success"}>
                      {entry.operation}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>SQL Console</CardTitle>
              <CardDescription>
                Ad-hoc PostgreSQL reads. SELECT/CTE only; writes belong in the controlled Data Editor so every mutation is scoped and audited.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                spellCheck={false}
                rows={10}
                className="w-full resize-y rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-foreground focus:border-brand focus:outline-none"
              />
              {!/\blimit\s+\d+/i.test(query) && (
                <p className="mt-2 text-xs text-warning">No LIMIT detected — results are capped at {ROW_LIMIT} rows server-side.</p>
              )}
            </CardContent>
            <CardFooter>
              <span className="text-xs text-muted">RLS + org/client scope remain active. 5s timeout.</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copySql}
                  disabled={!query.trim()}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-40"
                >
                  {copyLabel}
                </button>
                <button
                  type="button"
                  onClick={() => runQuery()}
                  disabled={isPending || !query.trim()}
                  className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {isPending ? "Running…" : "Run query"}
                </button>
              </div>
            </CardFooter>
          </Card>

          {queryError && (
            <Card className="border-danger/40 bg-danger/5">
              <CardContent>
                <p className="text-sm font-medium text-danger">Query failed</p>
                <p className="mt-1 font-mono text-xs text-danger/90">{queryError}</p>
              </CardContent>
            </Card>
          )}

          {queryRows && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>Query results</CardTitle>
                  <CardDescription>
                    {queryRows.length} row{queryRows.length === 1 ? "" : "s"}{queryDurationMs !== null ? ` · ${queryDurationMs}ms` : ""}
                  </CardDescription>
                </div>
                {queryRows.length > 0 && (
                  <button
                    type="button"
                    onClick={() => downloadCsv(queryRows, "query-results")}
                    className="rounded-md border border-border px-3 py-1.5 text-sm text-muted"
                  >
                    Export CSV
                  </button>
                )}
              </CardHeader>
              {queryRows.length === 0 ? (
                <CardContent><p className="text-sm text-muted">No rows returned.</p></CardContent>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
                      <tr>
                        {queryColumns.map((column) => (
                          <th key={column} className="whitespace-nowrap px-4 py-2 font-medium">{column}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {queryRows.map((row, index) => (
                        <tr key={index}>
                          {queryColumns.map((column) => (
                            <td key={column} className="whitespace-nowrap px-4 py-2 font-mono text-xs text-foreground">
                              {row[column] === null || row[column] === undefined ? <span className="text-muted">null</span> : formatCell(row[column])}
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
              <CardDescription>Read-only SQL history for this organization.</CardDescription>
            </CardHeader>
            {recentQueries.length === 0 ? (
              <CardContent><EmptyState icon="🛢" title="No queries yet" description="Your SQL reads will appear here." /></CardContent>
            ) : (
              <div className="divide-y divide-border">
                {recentQueries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => runQuery(entry.query)}
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
        </>
      )}
    </div>
  );
}
