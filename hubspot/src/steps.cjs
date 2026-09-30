const fs = require('fs');
const ids = require('./out/ids.json');
const [slug] = process.argv.slice(2);
const p = JSON.parse(fs.readFileSync(`out/plan-${slug}.json`));
const cid = ids[slug];
const rem = p.removes.map((r) => typeof r === 'string' ? { action: 'REMOVE', contentId: cid, moduleId: r } : { action: 'REMOVE_SECTION', contentId: cid, moduleId: r.section });
// Put section removals last-first so remaining module ids stay valid; one removal per batch.
const steps = p.batches.map((b) => [...b]);
let i = 0;
const base = steps.length; for (const r of rem) { if (i < base) steps[i++].push(r); else steps.push([r]); }
steps.forEach((s, n) => fs.writeFileSync(`out/step-${slug}-${n}.json`, JSON.stringify(s)));
console.log(slug, steps.length, 'steps');
