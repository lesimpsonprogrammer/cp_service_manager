import type { ConnectorAdapter, ExtractedRecord } from "../types";

const BASE_URLS: Record<string, string> = {
  sandbox: "https://api.paychex.com",
  production: "https://api.paychex.com",
};

function baseUrl(config: Record<string, unknown>): string {
  return BASE_URLS[String(config.environment ?? "sandbox")] ?? BASE_URLS.sandbox!;
}

async function fetchAccessToken(config: Record<string, unknown>): Promise<string> {
  const clientId = String(config.client_id ?? "");
  const clientSecret = String(config.client_secret ?? "");
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${baseUrl(config)}/auth/oauth/v2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=Workers",
  });

  if (!res.ok) {
    throw new Error(`Paychex Flex token request failed with status ${res.status}`);
  }
  const body = (await res.json()) as { access_token?: string };
  if (!body.access_token) {
    throw new Error("Paychex Flex token response did not include an access_token.");
  }
  return body.access_token;
}

async function fetchWorkers(config: Record<string, unknown>, accessToken: string): Promise<ExtractedRecord[]> {
  const companyId = String(config.company_id ?? "");
  const url = new URL(`${baseUrl(config)}/workers`);
  if (companyId) url.searchParams.set("companyId", companyId);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Paychex Flex worker list request failed with status ${res.status}`);
  }
  const body = (await res.json()) as { content?: ExtractedRecord[] };
  return body.content ?? [];
}

/**
 * Paychex Flex authenticates with OAuth2 client-credentials (Client
 * ID/Secret over HTTP Basic) to get a short-lived access token, then scopes
 * worker lookups to a single companyId — hence a dedicated adapter rather
 * than the generic restApiAdapter.
 */
export const paychexFlexAdapter: ConnectorAdapter = {
  async testConnection(config) {
    if (!config.client_id || !config.client_secret) {
      return { ok: false, message: "Client ID and Client Secret are required." };
    }
    try {
      const accessToken = await fetchAccessToken(config);
      const records = await fetchWorkers(config, accessToken);
      return {
        ok: true,
        message: `Connected. Found ${records.length} worker record(s).`,
        fieldsDetected: records[0] ? Object.keys(records[0]) : undefined,
      };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Failed to reach Paychex Flex." };
    }
  },

  async extract(config) {
    const accessToken = await fetchAccessToken(config);
    return { records: await fetchWorkers(config, accessToken) };
  },
};
