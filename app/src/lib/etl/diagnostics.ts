/**
 * Turns a pipeline run's raw error string into a plain-language diagnosis
 * with concrete next steps, so the run result panel can point someone in
 * the right direction instead of just echoing a connector/library error.
 */
export interface RunDiagnosis {
  summary: string;
  steps: string[];
}

interface Rule {
  test: RegExp;
  diagnose: RunDiagnosis;
}

const RULES: Rule[] = [
  {
    test: /response looks like an HTML page/i,
    diagnose: {
      summary: "The source URL returned a web page instead of the file it's configured to fetch.",
      steps: [
        "Open the URL directly in a browser — it likely requires login, or redirects to a sign-in or error page.",
        "Make sure the URL points straight at the file, not a page that only links to it.",
        "If the file needs authentication, a URL-based source can't fetch it — use an API or token-based connector instead.",
      ],
    },
  },
  {
    test: /response looks like JSON, not an Excel file/i,
    diagnose: {
      summary: "The URL returned JSON, but this data source is configured to read an Excel (.xlsx) file.",
      steps: [
        'Change the source\'s "Format" to match what the URL actually returns, or point the URL at the real .xlsx file.',
        "If the JSON is the data you want, use an API/REST connector instead of the web-scraper Excel format.",
      ],
    },
  },
  {
    test: /response body was empty/i,
    diagnose: {
      summary: "The URL responded successfully but sent back no content.",
      steps: [
        "Confirm the URL is correct and serves a file when you visit it directly.",
        "Check whether the source expects query parameters, a date range, or a report to be generated first.",
      ],
    },
  },
  {
    test: /not a valid \.xlsx file|Could not read the fetched file as an Excel workbook/i,
    diagnose: {
      summary: "The fetched file isn't a readable Excel workbook.",
      steps: [
        "Verify the URL serves an actual .xlsx file, not a .xls, .csv, or renamed file.",
        'If the file is really a .csv, switch this source\'s "Format" to CSV instead of Excel.',
        "Try downloading the URL manually and opening it — a corrupted or partial download will fail the same way here.",
      ],
    },
  },
  {
    test: /No <table> found at index/i,
    diagnose: {
      summary: "The page loaded, but there's no table at the configured table index.",
      steps: [
        "Open the source page and count which <table> on the page holds the data (0 = first table).",
        "Update the source's \"Table index\" setting to match, or check the page still has the expected layout.",
      ],
    },
  },
  {
    test: /Fetching .* failed: 4\d\d/i,
    diagnose: {
      summary: "The source URL rejected the request (client error — likely 401/403/404).",
      steps: [
        "Confirm the URL is correct and still exists.",
        "If it returned 401/403, the source needs credentials this connector isn't sending — check if an API/token-based connector fits better.",
      ],
    },
  },
  {
    test: /Fetching .* failed: 5\d\d/i,
    diagnose: {
      summary: "The source URL's server returned an error (5xx) — the problem is likely on their end.",
      steps: [
        "Wait a bit and try running the pipeline again.",
        "If it keeps failing, check the source system's status page or contact whoever hosts that URL.",
      ],
    },
  },
  {
    test: /ENOTFOUND|ECONNREFUSED|fetch failed|network/i,
    diagnose: {
      summary: "The connector couldn't reach the source at all — a network or DNS-level failure.",
      steps: [
        "Double-check the URL/host for typos.",
        "Confirm the source is reachable from the public internet (not behind an internal-only network).",
      ],
    },
  },
  {
    test: /File is too large/i,
    diagnose: {
      summary: "The source file is bigger than this connector can safely load into memory (25MB).",
      steps: [
        "Point the source at a smaller export, or a filtered/paginated endpoint.",
        "For large files, a database or API connector that streams data will fit better than the web-scraper adapter.",
      ],
    },
  },
  {
    test: /No connector adapter for source type/i,
    diagnose: {
      summary: "This data source's connector type isn't recognized by the pipeline engine.",
      steps: ["Edit the data source and re-select a valid connector type — its current type may be stale or unsupported."],
    },
  },
  {
    test: /can't be used as a pipeline destination yet/i,
    diagnose: {
      summary: "The configured destination doesn't support being loaded into.",
      steps: ["Edit this pipeline and choose a different destination — one whose connector supports loading records."],
    },
  },
  {
    test: /Source data source not found|Destination data source not found/i,
    diagnose: {
      summary: "One of this pipeline's data sources has been deleted or is no longer accessible.",
      steps: ["Edit this pipeline and re-select a valid source and destination."],
    },
  },
];

export function diagnoseRunError(error: string | null | undefined): RunDiagnosis | null {
  if (!error) return null;
  const rule = RULES.find((r) => r.test.test(error));
  if (rule) return rule.diagnose;
  return {
    summary: "The run failed in a way that doesn't match a known pattern — see the full error below.",
    steps: [
      "Use \"Test extract\" to check whether the problem is on the extract side or the load side.",
      "Check the source/destination configuration for typos or expired credentials.",
    ],
  };
}
