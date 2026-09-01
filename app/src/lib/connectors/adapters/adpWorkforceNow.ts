import type { ConnectorAdapter, ExtractedRecord } from "../types";

const TOKEN_URLS: Record<string, string> = {
  sandbox: "https://iat.accounts.adp.com/auth/oauth/v2/token",
  production: "https://accounts.adp.com/auth/oauth/v2/token",
};

const API_BASE_URLS: Record<string, string> = {
  sandbox: "https://iat.api.adp.com",
  production: "https://api.adp.com",
};

function tokenUrl(config: Record<string, unknown>): string {
  return TOKEN_URLS[String(config.environment ?? "sandbox")] ?? TOKEN_URLS.sandbox!;
}

function apiBaseUrl(config: Record<string, unknown>): string {
  return API_BASE_URLS[String(config.environment ?? "sandbox")] ?? API_BASE_URLS.sandbox!;
}

async function fetchAccessToken(config: Record<string, unknown>): Promise<string> {
  const clientId = String(config.client_id ?? "");
  const clientSecret = String(config.client_secret ?? "");
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(tokenUrl(config), {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(
      `ADP token request failed with status ${res.status}. ADP's production token endpoint requires mutual TLS with a certificate issued for your connection — the sandbox environment does not.`,
    );
  }
  const body = (await res.json()) as { access_token?: string };
  if (!body.access_token) {
    throw new Error("ADP token response did not include an access_token.");
  }
  return body.access_token;
}

async function fetchWorkers(config: Record<string, unknown>, accessToken: string): Promise<ExtractedRecord[]> {
  const res = await fetch(`${apiBaseUrl(config)}/hr/v2/workers`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`ADP employee list request failed with status ${res.status}`);
  }
  const body = (await res.json()) as { workers?: ExtractedRecord[] };
  return body.workers ?? [];
}

/**
 * ADP Workforce Now authenticates with OAuth2 client-credentials (Client
 * ID/Secret). Production traffic additionally requires mutual TLS with a
 * certificate ADP issues per connection — out of scope for this adapter, so
 * production requests will fail until that cert is wired into the fetch
 * call's TLS options.
 */
export const adpWorkforceNowAdapter: ConnectorAdapter = {
  async testConnection(config) {
    if (!config.client_id || !config.client_secret) {
      return { ok: false, message: "Client ID and Client Secret are required." };
    }
    try {
      const accessToken = await fetchAccessToken(config);
      const records = await fetchWorkers(config, accessToken);
      return {
        ok: true,
        message: `Connected. Found ${records.length} employee record(s).`,
        fieldsDetected: records[0] ? Object.keys(records[0]) : undefined,
      };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Failed to reach ADP Workforce Now." };
    }
  },

  async extract(config) {
    const accessToken = await fetchAccessToken(config);
    return { records: await fetchWorkers(config, accessToken) };
  },
};
