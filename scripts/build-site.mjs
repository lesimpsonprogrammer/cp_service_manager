// Expands <!-- INCLUDE:name key="value" ... --> markers in the marketing
// *.html pages using the partials in partials/, writing output to dist/.
// Run with `node scripts/build-site.mjs`. Vercel runs this as the build
// command (see vercel.json) so every page always reflects partials/header.html
// and partials/footer-*.html — edit those once instead of every page.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'dist');

const INCLUDE_RE = /<!--\s*INCLUDE:(\S+)((?:\s+[\w-]+="[^"]*")*)\s*-->/g;
const ATTR_RE = /([\w-]+)="([^"]*)"/g;

const partialCache = new Map();
function readPartial(name) {
  if (!partialCache.has(name)) {
    const file = path.join(root, 'partials', `${name}.html`);
    partialCache.set(name, fs.readFileSync(file, 'utf8'));
  }
  return partialCache.get(name);
}

function expandIncludes(html) {
  return html.replace(INCLUDE_RE, (_match, name, attrString) => {
    let partial = readPartial(name);
    let attrMatch;
    ATTR_RE.lastIndex = 0;
    while ((attrMatch = ATTR_RE.exec(attrString))) {
      const [, key, value] = attrMatch;
      partial = partial.split(`{{${key.toUpperCase()}}}`).join(value);
    }
    return partial;
  });
}

function copyStatic(entry) {
  const src = path.join(root, entry);
  const dest = path.join(outDir, entry);
  fs.cpSync(src, dest, { recursive: true });
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const htmlFiles = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  fs.writeFileSync(path.join(outDir, file), expandIncludes(html), 'utf8');
}

for (const entry of ['assets', 'styles.css', 'site.css', 'script.js', 'robots.txt']) {
  if (fs.existsSync(path.join(root, entry))) copyStatic(entry);
}

console.log(`Built ${htmlFiles.length} pages into dist/`);
