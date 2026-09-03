// One-time migration: extract the shared <header>/<footer> markup that is
// hand-duplicated across the marketing pages into partials/, and replace
// each page's copy with an <!-- INCLUDE:name --> marker. Run once via
// `node scripts/templatize-nav.mjs`, then re-run `node scripts/build-site.mjs`
// to regenerate the pages from the partials (verifies round-trip fidelity).
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

const pages = [
  'index.html',
  'about.html',
  'contact.html',
  'data-apis.html',
  'data-connectors.html',
  'data-glossary.html',
  'data-handling-policy.html',
  'data-security-governance.html',
  'data-webhooks.html',
  'executive-brief.html',
  'hipaa.html',
  'relentless.html',
  'resources.html',
  'services.html',
  'thank-you.html',
];

function extractBlock(html, tag) {
  const openRe = new RegExp(`<${tag}[^>]*>`);
  const openMatch = openRe.exec(html);
  if (!openMatch) return null;
  const closeTag = `</${tag}>`;
  const closeIdx = html.indexOf(closeTag, openMatch.index);
  if (closeIdx === -1) return null;
  const end = closeIdx + closeTag.length;
  return { start: openMatch.index, end, block: html.slice(openMatch.index, end) };
}

const headerVariants = new Map(); // logoSrc -> canonical template (with {{LOGO_SRC}})
const footerVariants = new Map(); // normalized body -> { name, template }
let footerCount = 0;

// Pass 1: collect header logo variants and footer variants.
for (const page of pages) {
  const file = path.join(root, page);
  const html = fs.readFileSync(file, 'utf8');

  const header = extractBlock(html, 'header');
  if (header) {
    const logoMatch = /<img src="([^"]+)" alt="Momentum Data Solutions" class="brand-logo" \/>/.exec(header.block);
    const logoSrc = logoMatch ? logoMatch[1] : null;
    const templated = logoMatch
      ? header.block.replace(logoMatch[0], logoMatch[0].replace(logoMatch[1], '{{LOGO_SRC}}'))
      : header.block;
    if (!headerVariants.has(templated)) headerVariants.set(templated, true);
  }

  const footer = extractBlock(html, 'footer');
  if (footer) {
    if (!footerVariants.has(footer.block)) {
      footerCount += 1;
      footerVariants.set(footer.block, `footer-${footerCount}`);
    }
  }
}

if (headerVariants.size !== 1) {
  console.error(`Expected exactly one header template shape, found ${headerVariants.size}. Aborting.`);
  process.exit(1);
}
const headerTemplate = [...headerVariants.keys()][0];
fs.writeFileSync(path.join(root, 'partials/header.html'), headerTemplate, 'utf8');
console.log('Wrote partials/header.html');

for (const [block, name] of footerVariants) {
  fs.writeFileSync(path.join(root, `partials/${name}.html`), block, 'utf8');
  console.log(`Wrote partials/${name}.html`);
}

// Pass 2: replace each page's header/footer with include markers.
for (const page of pages) {
  const file = path.join(root, page);
  let html = fs.readFileSync(file, 'utf8');

  const header = extractBlock(html, 'header');
  const logoMatch = header ? /<img src="([^"]+)" alt="Momentum Data Solutions" class="brand-logo" \/>/.exec(header.block) : null;
  const logoSrc = logoMatch ? logoMatch[1] : 'assets/momentum-data-logo-transparent.svg';

  const footer = extractBlock(html, 'footer');
  const footerName = footer ? footerVariants.get(footer.block) : null;

  // Replace footer first (later offset) so header's indices stay valid.
  if (footer) {
    html = html.slice(0, footer.start) + `<!-- INCLUDE:${footerName} -->` + html.slice(footer.end);
  }
  if (header) {
    html = html.slice(0, header.start) + `<!-- INCLUDE:header logo_src="${logoSrc}" -->` + html.slice(header.end);
  }

  fs.writeFileSync(file, html, 'utf8');
  console.log(`Templatized ${page} (logo=${logoSrc}, footer=${footerName})`);
}
