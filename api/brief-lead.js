// Vercel serverless function (Node runtime, auto-detected from /api).
// Captures an email submitted against the "Executive Brief" gate on
// executive-brief.html / the app landing page, stores it in Supabase
// (service-role key — RLS blocks every other access path), and notifies
// the team + the submitter via Resend. Both side effects are best-effort:
// the lead is not lost if Resend is unreachable or unconfigured.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const source = typeof req.body?.source === "string" ? req.body.source.slice(0, 120) : "executive-brief";

  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("brief-lead: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured");
    res.status(500).json({ error: "Lead capture is not configured yet." });
    return;
  }

  const insertResp = await fetch(`${supabaseUrl}/rest/v1/brief_download_leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify([{ email, source }]),
  });

  if (!insertResp.ok) {
    const detail = await insertResp.text().catch(() => "");
    console.error("brief-lead: Supabase insert failed", insertResp.status, detail);
    res.status(502).json({ error: "Could not save your email. Please try again." });
    return;
  }

  await notifyByEmail(email, source).catch((err) => {
    console.error("brief-lead: Resend notification failed", err);
  });

  res.status(200).json({ ok: true });
};

async function notifyByEmail(email, source) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const from = process.env.RESEND_FROM_EMAIL || "notifications@momentumdatasolutions.com";
  const notifyTo = process.env.LEAD_NOTIFY_EMAIL || "compliance@momentumdatasolutions.com";
  const briefUrl = "https://www.momentumdatasolutions.com/assets/momentum-executive-brief.pdf";

  const send = (payload) =>
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

  const attachment = await fetchBriefAttachment(briefUrl);

  await Promise.all([
    send({
      from,
      to: notifyTo,
      subject: "New Executive Brief lead",
      text: `${email} just requested the Executive Brief from "${source}".`,
    }),
    send({
      from,
      to: email,
      subject: "Your Momentum Data Solutions Executive Brief",
      text: `Thanks for your interest in Momentum Data Solutions.\n\nYour copy of "The Momentum Executive Brief: Why Clean Data Comes First" is attached${attachment ? "" : " — you can also read it here: " + briefUrl}.\n\n— Momentum Data Solutions`,
      ...(attachment ? { attachments: [attachment] } : {}),
    }),
  ]);
}

async function fetchBriefAttachment(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const buffer = Buffer.from(await resp.arrayBuffer());
    return { filename: "momentum-executive-brief.pdf", content: buffer.toString("base64") };
  } catch (err) {
    console.error("brief-lead: could not fetch brief PDF for attachment", err);
    return null;
  }
}
