import type { ConnectorAdapter, ExtractedRecord, LoadResult, UnloadResult } from "../types";

const API_BASE = "https://api.hubapi.com";
const BATCH_SIZE = 100; // HubSpot's batch endpoints cap inputs at 100 per call.

function objectType(config: Record<string, unknown>): string {
  return String(config.object_type ?? "contacts");
}

function idProperty(config: Record<string, unknown>): string {
  return String(config.id_property ?? "email").trim() || "email";
}

function headers(config: Record<string, unknown>): HeadersInit {
  return {
    Authorization: `Bearer ${String(config.access_token ?? "")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

async function fetchPage(
  config: Record<string, unknown>,
  after?: string
): Promise<{ records: ExtractedRecord[]; nextAfter?: string }> {
  const url = new URL(`${API_BASE}/crm/v3/objects/${objectType(config)}`);
  url.searchParams.set("limit", "100");
  if (after) url.searchParams.set("after", after);

  const res = await fetch(url.toString(), { headers: headers(config) });
  if (!res.ok) {
    throw new Error(`HubSpot request failed with status ${res.status}: ${await res.text()}`);
  }
  const body = (await res.json()) as {
    results?: Array<{ id: string; properties: Record<string, unknown> }>;
    paging?: { next?: { after?: string } };
  };
  const records = (body.results ?? []).map((r) => ({ id: r.id, ...r.properties }));
  return { records, nextAfter: body.paging?.next?.after };
}

/** Looks up the HubSpot object id for a record by its configured id property, for unload. */
async function findObjectId(config: Record<string, unknown>, value: unknown): Promise<string | undefined> {
  const res = await fetch(`${API_BASE}/crm/v3/objects/${objectType(config)}/search`, {
    method: "POST",
    headers: headers(config),
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: idProperty(config), operator: "EQ", value: String(value) }] }],
      limit: 1,
    }),
  });
  if (!res.ok) return undefined;
  const body = (await res.json()) as { results?: Array<{ id: string }> };
  return body.results?.[0]?.id;
}

/**
 * HubSpot CRM connector. Authenticates with a private-app bearer token
 * (scoped to crm.objects.contacts / crm.objects.companies) rather than the
 * generic REST API auth modes, and is object-type aware (contacts vs
 * companies share the same /crm/v3/objects/{type} shape but different
 * default id properties).
 *
 * `load` upserts by the configured id property (e.g. email for contacts)
 * via HubSpot's batch/upsert endpoint, which is idempotent on re-runs.
 * `unload` has to look up each record's HubSpot object id by that same id
 * property first, since batch/archive only accepts HubSpot's internal ids —
 * unlike the value-match delete other adapters use, this can miss a record
 * if the id property was changed or cleared between load and unload.
 */
export const hubspotAdapter: ConnectorAdapter = {
  async testConnection(config) {
    if (!config.access_token) {
      return { ok: false, message: "Private App access token is required." };
    }
    try {
      const { records } = await fetchPage(config);
      return {
        ok: true,
        message: `Connected. Found ${records.length} ${objectType(config)} record(s) on the first page.`,
        fieldsDetected: records[0] ? Object.keys(records[0]) : undefined,
      };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Failed to reach HubSpot." };
    }
  },

  async extract(config) {
    const records: ExtractedRecord[] = [];
    let after: string | undefined;
    let pages = 0;
    do {
      const page = await fetchPage(config, after);
      records.push(...page.records);
      after = page.nextAfter;
      pages += 1;
    } while (after && pages < 50); // guard against runaway pagination on huge portals

    return { records, truncated: Boolean(after) };
  },

  async load(config, records): Promise<LoadResult> {
    const prop = idProperty(config);
    if (records.length === 0) return { loaded: 0, failed: 0 };

    let loaded = 0;
    let failed = 0;
    let firstError: string | undefined;

    for (const batch of chunk(records, BATCH_SIZE)) {
      const inputs = batch
        .filter((r) => r[prop] !== undefined && r[prop] !== null)
        .map((r) => {
          const properties = { ...r };
          delete properties.id;
          return { idProperty: prop, id: String(r[prop]), properties };
        });
      failed += batch.length - inputs.length; // records missing the id property can't be upserted
      if (inputs.length === 0) continue;

      const res = await fetch(`${API_BASE}/crm/v3/objects/${objectType(config)}/batch/upsert`, {
        method: "POST",
        headers: headers(config),
        body: JSON.stringify({ inputs }),
      });

      if (res.ok) {
        loaded += inputs.length;
      } else {
        failed += inputs.length;
        firstError ??= `HubSpot batch upsert failed with status ${res.status}: ${await res.text()}`;
      }
    }

    return { loaded, failed, error: firstError };
  },

  async unload(config, records): Promise<UnloadResult> {
    const prop = idProperty(config);
    if (records.length === 0) return { deleted: 0, failed: 0 };

    let deleted = 0;
    let failed = 0;
    let firstError: string | undefined;

    const ids: string[] = [];
    for (const record of records) {
      const value = record[prop];
      if (value === undefined || value === null) {
        failed += 1;
        continue;
      }
      const id = await findObjectId(config, value);
      if (id) {
        ids.push(id);
      } else {
        failed += 1;
      }
    }

    for (const batch of chunk(ids, BATCH_SIZE)) {
      const res = await fetch(`${API_BASE}/crm/v3/objects/${objectType(config)}/batch/archive`, {
        method: "POST",
        headers: headers(config),
        body: JSON.stringify({ inputs: batch.map((id) => ({ id })) }),
      });
      if (res.ok) {
        deleted += batch.length;
      } else {
        failed += batch.length;
        firstError ??= `HubSpot batch archive failed with status ${res.status}: ${await res.text()}`;
      }
    }

    return { deleted, failed, error: firstError };
  },
};
