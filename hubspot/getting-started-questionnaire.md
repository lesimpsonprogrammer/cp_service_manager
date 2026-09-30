# Getting Started Questionnaire — HubSpot form spec

Build this in HubSpot: **Marketing → Forms → Create form → Embedded form → Blank**.
Name it **"Getting Started Questionnaire"**. Use the page breaks below if your form
editor supports multi-step forms; otherwise keep it on one page with the section
headings as rich-text dividers.

Questions follow the five phases of a Momentum engagement (see the Client onboarding
guide on the docs site). "Existing property" means HubSpot already has the field; for
everything else click **Create new property** (Contact properties) and use the internal
name shown.

---

## Step 1 — About you

| # | Label | Field type | Required | Property |
|---|-------|-----------|----------|----------|
| 1 | First name | Single-line text | Yes | existing `firstname` |
| 2 | Last name | Single-line text | Yes | existing `lastname` |
| 3 | Work email | Email | Yes | existing `email` |
| 4 | Phone | Phone number | No | existing `phone` |
| 5 | Company | Single-line text | Yes | existing `company` |
| 6 | Job title | Single-line text | No | existing `jobtitle` |
| 7 | Number of employees | Dropdown: 1–49 · 50–199 · 200–499 · 500–999 · 1,000–4,999 · 5,000+ | Yes | new `gs_employee_count` |
| 8 | States you employ people in | Single-line text (help text: "e.g. TX, OK, LA") | No | new `gs_states` |

## Step 2 — What you need

| # | Label | Field type | Required | Property |
|---|-------|-----------|----------|----------|
| 9 | Which services are you interested in? | Multiple checkboxes: Data management / migration · HCM or ERP implementation support · Human resources consulting · Managed payroll · Payroll processing · Year-end reporting · Data APIs, webhooks or connectors · Cloud Performance Service Manager | Yes | new `gs_services` |
| 10 | Where is your project today? | Radio: Just exploring · Selecting a system · Vendor chosen, not started · Implementation underway · Already live, need help | Yes | new `gs_project_stage` |
| 11 | What's driving the project? | Multi-line text | No | new `gs_project_drivers` |

## Step 3 — Your systems and data

| # | Label | Field type | Required | Property |
|---|-------|-----------|----------|----------|
| 12 | Current HR / payroll system(s) | Single-line text (help text: "e.g. ADP, Paylocity, spreadsheets") | No | new `gs_current_systems` |
| 13 | New system you're moving to (if any) | Single-line text | No | new `gs_target_system` |
| 14 | Where does your data live today? | Multiple checkboxes: HR/payroll platform · ERP · Spreadsheets · Benefits carrier files · Time and attendance system · Other | No | new `gs_data_sources` |
| 15 | Supporting documents (optional) | File upload — allow multiple files; accepted types: PDF, DOCX, XLSX, CSV, PNG, JPG; max 10 MB each | No | new `gs_documents` (type: File) |

Help text for #15: "Share org charts, pay-rule documents, sample file layouts or project plans. Files are encrypted in transit and at rest. **Do not upload employee records, SSNs, bank details or any health information** — we'll set up a secure transfer channel for that after our first conversation."

In the file property's settings, set **File visibility → Private** so uploads are not reachable by public URL.

## Step 3b — HIPAA and sensitive data

| # | Label | Field type | Required | Property |
|---|-------|-----------|----------|----------|
| 16 | Will this project involve protected health information (PHI)? | Radio: Yes · No · Not sure | Yes | new `gs_phi` |
| 17 | Which describes your organization? | Radio: HIPAA covered entity (health plan, provider, clearinghouse) · Employer sponsoring a self-insured health plan · Business associate of a covered entity · None of these · Not sure | Show only if #16 = Yes or Not sure | new `gs_hipaa_role` |
| 18 | What kinds of health-related data are in scope? | Multiple checkboxes: Benefits enrollment files · Claims or carrier extracts · Leave (FMLA) records · Accommodation / medical documentation · Other | Show only if #16 = Yes or Not sure | new `gs_phi_types` |
| 19 | Will you need a Business Associate Agreement (BAA) with Momentum? | Radio: Yes · No · Not sure — please advise | Show only if #16 = Yes or Not sure | new `gs_needs_baa` |
| 20 | Other compliance requirements | Multiple checkboxes: SOC 2 report · Security questionnaire · State privacy laws (e.g. CCPA) · Data residency · None · Not sure | No | new `gs_compliance_reqs` |

Use HubSpot's **conditional logic** (click #16 → Logic → "is any of Yes, Not sure" → show #17–#19).
Help text for #16: "PHI is never collected through this form. If you answer Yes, we'll execute a BAA before any data is transferred, per our HIPAA practices."

## Step 4 — Timeline and team

| # | Label | Field type | Required | Property |
|---|-------|-----------|----------|----------|
| 21 | Target go-live or deadline | Date picker | No | new `gs_target_date` |
| 22 | Do you have a project sponsor who can approve sign-offs? | Radio: Yes · Not yet | Yes | new `gs_has_sponsor` |
| 23 | Who will be your day-to-day contact? | Single-line text (help text: "Name and role — can be you") | No | new `gs_day_to_day_contact` |
| 24 | Anything else we should know? | Multi-line text | No | new `gs_notes` |

---

## Form options

- **After submit:** Display a thank-you message:
  "Thanks — we have what we need to prepare. A member of the Momentum team will contact you within two business days to schedule a focused discovery conversation."
- **Notifications:** send submissions to hello@momentumdatasolutions.com (or whoever owns intake).
- **Consent:** turn on the default legal consent text (same as the Contact form).
- **Security note:** HubSpot file uploads are encrypted in transit and at rest, but HubSpot forms are not approved for PHI unless your portal has HubSpot's sensitive-data protection enabled with a signed BAA (confirm with HubSpot before relying on it). Keep the "no health information" help text on the upload field, and move PHI through a secure managed file transfer channel after the BAA is signed.

When the form is created and published, tell Claude its name and it will be embedded on
the Getting Started page.
