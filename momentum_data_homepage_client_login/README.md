# Momentum Data Website Starter

This is a one-page responsive website for Momentum Data, a small business focused on data extraction, spreadsheet cleanup, reporting, workflow automation, and HCM/payroll data support.

## Files included

- `index.html` — main website page
- `styles.css` — website styling and responsive layout
- `script.js` — mobile navigation and current year script

## How to preview locally

1. Unzip this folder.
2. Open `index.html` in your browser.

## How to publish online

You can upload this folder to a static hosting service such as Netlify, GitHub Pages, Vercel, or your web host.

For the easiest Netlify upload:

1. Unzip the ZIP file.
2. Drag the entire `momentum-data-website` folder into Netlify's deploy area.
3. Netlify will give you a temporary live website link.

## Before publishing

1. Replace `your-email@example.com` in `index.html` with your real business email.
2. Review the service wording and package names.
3. Connect the contact form to Netlify Forms, Formspree, or another form service if you do not want to use the mail app fallback.


Review update:
- Removed the hero card for a cleaner hero section.
- Applied the white, light blue, #1f6feb blue, and dark orange palette.
- Updated typography: Cormorant Garamond for titles/subtitles and Arial for body/navigation text.
- Adjusted header so menu links center and Contact us sits on the right on desktop.


## Logo update

This version includes the Momentum Data logo applied to the website header, hero area, and footer.

Logo assets included:
- `assets/momentum-data-md-mark.png` — standalone MD logo graphic
- `assets/momentum-data-wordmark.png` — standalone Momentum Data wordmark
- `assets/momentum-data-logo-full.png` — combined MD graphic and Momentum Data wordmark
- `assets/favicon.svg` — browser tab icon


## Latest review fixes

- Fixed the hero text carousel so only one sentence displays at a time.
- Added the orange-to-blue gradient navigation bar.
- Restored the desktop navigation spacing with `gap: 30px`.
- Cleaned duplicate navigation link CSS rules that were overriding the white nav text.
- Kept the mobile menu readable on a white dropdown background.
- Kept the navigation logo controlled so it does not appear oversized.
- Corrected the Home link to point back to the top of the page.


## Client Log-in update

This version adds the **Client Log-in** button to the main website homepage navigation directly after the **Contact us** button.

Files added/updated:
- `index.html` — added the Client Log-in button to the homepage navigation and hero section.
- `login.html` — client login demo page.
- `client.html` — client-only project page with welcome message and project table.
- `assets/client-portal-bg.jpg` — top-section background image for the client page.
- `styles.css` and `script.js` — supporting styles and demo login behavior.

Open `index.html` first. The Client Log-in button links to `login.html`.

Note: This is a front-end demo. A production client-only page should be connected to secure backend authentication.
