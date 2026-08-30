import { Client } from "pg";
import type { ConnectorAdapter } from "../types";

function isReadOnlyQuery(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  return normalized.startsWith("select") || normalized.startsWith("with");
}

async function withClient<T>(config: Record<string, unknown>, fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({
    host: String(config.host ?? ""),
    port: Number(config.port ?? 5432),
    database: String(config.database ?? ""),
    user: String(config.username ?? ""),
    password: String(config.password ?? ""),
    ssl: String(config.ssl ?? "true") === "true" ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 8000,
  });

  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/**
 * Postgres connector. Only SELECT / WITH queries are allowed — this is an
 * extraction source, not a general SQL runner. MySQL / SQL Server are
 * declared in the registry but not yet implemented; add sibling adapters
 * (e.g. `mysql2`, `mssql`) and wire them up in `../index.ts` to support them.
 */
export const postgresAdapter: ConnectorAdapter = {
  async testConnection(config) {
    const engine = String(config.engine ?? "postgres");
    if (engine !== "postgres") {
      return { ok: false, message: `${engine} support is coming soon — PostgreSQL is available today.` };
    }
    const query = String(config.query ?? "");

    try {
      if (query) {
        if (!isReadOnlyQuery(query)) {
          return { ok: false, message: "Only SELECT / WITH queries are allowed for data extraction." };
        }
        const result = await withClient(config, (client) => client.query(`${query.replace(/;\s*$/, "")} LIMIT 1`));
        return { ok: true, message: "Connected successfully.", fieldsDetected: result.fields.map((f) => f.name) };
      }

      await withClient(config, (client) => client.query("select 1"));
      return { ok: true, message: "Connected successfully." };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Connection failed." };
    }
  },

  async extract(config) {
    const query = String(config.query ?? "");
    if (!isReadOnlyQuery(query)) {
      throw new Error("Only SELECT / WITH queries are allowed for data extraction.");
    }
    const result = await withClient(config, (client) => client.query(query));
    return { records: result.rows, truncated: false };
  },

  async load(config, records) {
    const table = String(config.load_table ?? "").trim();
    if (!table) throw new Error("Set a destination table for this data source first.");
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/.test(table)) {
      throw new Error("Destination table must look like `table` or `schema.table`.");
    }
    if (records.length === 0) return { loaded: 0, failed: 0 };

    const columns = Array.from(new Set(records.flatMap((r) => Object.keys(r))));
    if (columns.length === 0) return { loaded: 0, failed: 0 };

    const identifier = (name: string) => `"${name.replace(/"/g, '""')}"`;
    const columnList = columns.map(identifier).join(", ");
    let loaded = 0;
    let failed = 0;

    await withClient(config, async (client) => {
      for (const record of records) {
        const values = columns.map((c) => record[c] ?? null);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
        try {
          await client.query(`insert into ${table} (${columnList}) values (${placeholders})`, values);
          loaded += 1;
        } catch {
          failed += 1;
        }
      }
    });

    return { loaded, failed };
  },

  async unload(config, records) {
    const table = String(config.load_table ?? "").trim();
    if (!table) throw new Error("Set a destination table for this data source first.");
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/.test(table)) {
      throw new Error("Destination table must look like `table` or `schema.table`.");
    }
    if (records.length === 0) return { deleted: 0, failed: 0 };

    const identifier = (name: string) => `"${name.replace(/"/g, '""')}"`;
    let deleted = 0;
    let failed = 0;

    await withClient(config, async (client) => {
      for (const record of records) {
        const columns = Object.keys(record);
        if (columns.length === 0) {
          failed += 1;
          continue;
        }
        const conditions = columns.map((c, i) => `${identifier(c)} is not distinct from $${i + 1}`).join(" and ");
        const values = columns.map((c) => record[c] ?? null);
        try {
          // Deletes at most one matching row per record (rather than every
          // row with these values) via a ctid subquery, since plain DELETE
          // has no LIMIT clause in Postgres.
          const result = await client.query(
            `delete from ${table} where ctid = (select ctid from ${table} where ${conditions} limit 1)`,
            values
          );
          if (result.rowCount && result.rowCount > 0) {
            deleted += 1;
          } else {
            failed += 1;
          }
        } catch {
          failed += 1;
        }
      }
    });

    return { deleted, failed };
  },
};
