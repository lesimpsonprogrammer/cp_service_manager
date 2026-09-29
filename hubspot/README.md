# HubSpot site pages

Editable HubSpot versions of the Momentum site pages, generated from the
Claude Design bundle that currently serves momentumdatasolutions.com.

- `templates/` — one HubL template per page. Each page body is a
  drag-and-drop area (one rich-text module per section, plus HubSpot form
  modules on Contact and Executive Brief), so everything is editable in the
  HubSpot page editor. The header nav is read from the HubSpot navigation
  menu (id 383035789010), so nav changes are made once under
  Settings → Content → Navigation menus.
- `src/` — the scripts that produced them:
  1. `extract.cjs` / `gloss.cjs` render the design bundle in Chromium and
     capture each page's sections (`out/pages.json`, `out/glossary.txt`).
  2. `gen.cjs` turns those into HubL templates using `header.hubl`,
     `site.css` and `glossary.js`.
  3. `preview.cjs <slug>` renders a rough local preview (HubL stripped).

Run the scripts from a scratch directory that contains the downloaded
bundle (`page_036c60.html`) and these source files.
