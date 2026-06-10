<!-- Copilot / AI agent instructions for Momentum Data starter site -->
# Momentum Data — AI Contributor Guide

This project is a small, static website starter for Momentum Data. The guidance below focuses on the concrete, discoverable patterns and tasks an AI coding agent can perform productively without guessing.

## Big picture
- Single-page marketing site: `index.html` is the canonical entry. Styling is in `styles.css` and client-side behavior is in `script.js`.
- Client demo: `login.html` and `client.html` are a static client portal preview (no backend or secure auth provided).
- Assets live in `assets/` (images, favicon, logos).

## What to know immediately (key files)
- `index.html` — main content, contact form uses `action="mailto:your-email@example.com"` (replace before publishing).
- `script.js` — small DOM utilities: nav toggle, hero carousel, cookie banner, and demo client login logic.
  - Cookie localStorage key: `momentumDataCookieNoticeAccepted`.
  - Carousel interval: 3500ms.
- `styles.css` — CSS variables for brand colors and fonts (`--font-heading: Cormorant Garamond`).
- `client-portal.html`, `client.html`, `login.html` — client pages and demo flows. The README notes this is a front-end demo only.

## Project-specific conventions & gotchas
- No build system: preview by opening `index.html` in a browser or serve statically with a simple HTTP server.
- Contact form: currently relies on `mailto:`. If connecting to Netlify/Vercel, convert to the provider's expected markup (Netlify Forms, Formspree, etc.).
- Static-demo auth mismatch: `script.js` expects form fields and portal element IDs like `companyName`, `portalClientCompany`, `portalProjectName`, `portalProjectDetails`, `portalDueDate`, `portalLogout` — but `login.html` and `client.html` use different IDs (e.g., `clientCompany`, `companyCell`). Address these inconsistencies when implementing client-login improvements or tests.
- Accessibility: ARIA attributes are present (aria-live on carousel, aria-labels on nav). Preserve these when refactoring DOM structure.

## Development & debugging workflow
- Quick preview (local): open `index.html` or run a local static server (example):

```
python3 -m http.server 8000
# then open http://localhost:8000/index.html
```

- Use browser DevTools to inspect DOM IDs referenced by `script.js` when debugging client-login behavior.
- Replace `your-email@example.com` in `index.html` before publishing or wire to form provider.

## Common, actionable tasks for an AI agent
- Fix the demo login DOM mismatch: either update `script.js` to match `login.html`/`client.html` IDs or normalize the HTML IDs and names.
- Harden contact form guidance: add a short note in `index.html` and README about Netlify/Vercel form integration and required hidden inputs (if implementing).
- Add a simple `npm`/`Makefile` dev helper only if asked — keep the repo minimal unless the maintainer requests a build pipeline.

## Integration points & external dependencies
- External fonts: Google Fonts (Cormorant Garamond).
- No server-side code, no tests, and no package manifest present. Deploy as static site to Netlify/GitHub Pages/Vercel.

## Examples to reference in the repo
- Cookie handling: see `script.js` lines that use `momentumDataCookieNoticeAccepted` and `cookieNotice`/`cookieAccept` elements.
- Contact form action: `index.html` form element with `action="mailto:your-email@example.com"`.
- Hero carousel: `index.html` `.hero-text-carousel` and `script.js` carousel logic.

## When to ask the maintainer
- Before adding a build system or package.json.
- If you plan to add server-side authentication or persistent storage — confirm preferred provider.
- If you change public URLs (e.g., move files), confirm publishing target (GitHub Pages vs Netlify).

---
If anything in this file is unclear or you want more examples (e.g., an automated fix PR to reconcile the `script.js`/HTML ID mismatch), tell me which area to expand and I will update the instructions or prepare the change.
