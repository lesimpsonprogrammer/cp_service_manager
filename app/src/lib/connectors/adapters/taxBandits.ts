import type { ConnectorAdapter, ExtractedRecord } from "../types";

const BASE_URLS: Record<string, string> = {
  sandbox: "https://testapi.taxbandits.com",
  production: "https://api.taxbandits.com",
};

const LIST_ENDPOINTS: Record<string, string> = {
  "1099nec": "/Form1099NEC/List",
  "1099misc": "/Form1099MISC/List",
  w2: "/FormW2/List",
};

function baseUrl(config: Record<string, unknown>): string {
  return BASE_URLS[String(config.environment ?? "sandbox")] ?? BASE_URLS.sandbox!;
}

async function fetchAccessToken(config: Record<string, unknown>): Promise<string> {
  const clientId = String(config.client_id ?? "");
  const clientSecret = String(config.client_secret ?? "");
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${baseUrl(config)}/v1.7.3/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`TaxBandits token request failed with status ${res.status}`);
  }
  const body = (await res.json()) as { access_token?: string };
  if (!body.access_token) {
    throw new Error("TaxBandits token response did not include an access_token.");
  }
  return body.access_token;
}

async function fetchForms(config: Record<string, unknown>, accessToken: string): Promise<ExtractedRecord[]> {
  const endpoint = LIST_ENDPOINTS[String(config.form_type ?? "1099nec")] ?? LIST_ENDPOINTS["1099nec"]!;
  const res = await fetch(`${baseUrl(config)}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      UserToken: String(config.user_token ?? ""),
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`TaxBandits form list request failed with status ${res.status}`);
  }
  const body = (await res.json()) as { Forms1099Data?: ExtractedRecord[]; FormsW2Data?: ExtractedRecord[] };
  return body.Forms1099Data ?? body.FormsW2Data ?? [];
}

/**
 * TaxBandits authenticates with OAuth2 client-credentials (Client ID/Secret)
 * to get a short-lived access token, then requires a separate account-level
 * UserToken header on every API call — hence a dedicated adapter rather than
 * the generic restApiAdapter's bearer/api-key/basic auth modes.
 */
export const taxBanditsAdapter: ConnectorAdapter = {
  async testConnection(config) {
    if (!config.client_id || !config.client_secret || !config.user_token) {
      return { ok: false, message: "Client ID, Client Secret, and User Token are all required." };
    }
    try {
      const accessToken = await fetchAccessToken(config);
      const records = await fetchForms(config, accessToken);
      return {
        ok: true,
        message: `Connected. Found ${records.length} filed form(s).`,
        fieldsDetected: records[0] ? Object.keys(records[0]) : undefined,
      };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Failed to reach TaxBandits." };
    }
  },

  async extract(config) {
    const accessToken = await fetchAccessToken(config);
    return { records: await fetchForms(config, accessToken) };
  },
};
