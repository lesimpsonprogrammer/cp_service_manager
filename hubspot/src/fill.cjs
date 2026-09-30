// Build HubSpot BATCH operations that fill the Elevate master layout for each inner page.
// Master module ids (Data Management page 403082863298, cloned for the rest):
//   hero: eyebrow m2, h1 m1, lead m3, button m4
//   S1..S3: label, h2, body, cardsA, cardsB  (see SLOTS)
//   CTA: h2 m20, text m21, button m22
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('out/struct.json'));

const SLOTS = [
  { label: 'dnd_area-module-6', h2: 'dnd_area-module-5', body: 'dnd_area-module-7', cardsA: 'dnd_area-module-8', cardsB: 'dnd_area-module-9' },
  { label: 'dnd_area-module-11', h2: 'dnd_area-module-10', body: 'dnd_area-module-12', cardsA: 'dnd_area-module-13', cardsB: 'dnd_area-module-14' },
  { label: 'dnd_area-module-16', h2: 'dnd_area-module-15', body: 'dnd_area-module-17', cardsA: 'dnd_area-module-18', cardsB: 'dnd_area-module-19' },
];
const HERO = { eyebrow: 'dnd_area-module-2', h1: 'dnd_area-module-1', lead: 'dnd_area-module-3', button: 'dnd_area-module-4' };
const CTA = { h2: 'dnd_area-module-20', text: 'dnd_area-module-21', button: 'dnd_area-module-22' };
const ICONS = ['circle-check', 'layer-group', 'shield-halved', 'chart-line', 'gears', 'users', 'file-lines', 'plug'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pill = (t) => `<span style="display:inline-block;padding:5px 14px;border:1px solid #c7d0e6;border-radius:999px;font-size:13px;font-weight:600;color:#202a50;">${esc(t)}</span>`;
const link = (href) => ({ url: { href, type: 'EXTERNAL' }, open_in_new_tab: false });
const button = (b) => ({ buttonContentText: b.text, buttonContentLink: link(b.href), buttonContentShowIcon: false, buttonContentIcon: { name: 'arrow-right' }, buttonContentIconPosition: 'right' });

// Turn a section's text blocks into rich text, dropping text that already lives in the label, title or buttons.
function bodyHtml(sec) {
  const skip = new Set([sec.eyebrow, sec.title, sec.number, ...sec.buttons.map((b) => b.text)].filter(Boolean));
  const out = [];
  let list = [];
  const flush = () => { if (list.length) { out.push('<ul>' + list.map((t) => `<li>${t}</li>`).join('') + '</ul>'); list = []; } };
  const blocks = sec.blocks.filter((b) => !skip.has(b.text));
  const isItem = (b) => b && b.tag !== 'h3' && (b.tag === 'li' || (b.text.length < 110 && !/[.?!:]$/.test(b.text) && (!/^\d/.test(b.text) || b.text.length < 30)));
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    let t = esc(b.text);
    if (b.href && b.linkText && !/^\s*$/.test(b.linkText)) t = t.replace(esc(b.linkText), `<a href="${esc(b.href)}">${esc(b.linkText)}</a>`);
    const next = blocks[i + 1];
    if (b.tag === 'h3') { flush(); out.push(`<h3>${t}</h3>`); }
    // A short label followed by a full sentence is a "term + description" pair, not a list item.
    else if (isItem(b) && next && !isItem(next) && next.tag !== 'h3') { flush(); out.push(`<p><strong>${t}</strong><br>${esc(next.text)}</p>`); i++; }
    else if (isItem(b)) list.push(t);
    else { flush(); out.push(`<p>${t}</p>`); }
  }
  flush();
  return out.join('');
}

const cardsField = (cards, offset) => ({
  imageOrIcon: 'icon',
  groupCards: cards.map((c, i) => ({
    groupIcon: { icon: { name: ICONS[(offset + i) % ICONS.length] } },
    groupContent: { headingAndTextHeadingLevel: 'h3', headingAndTextHeading: c.title, richTextContentHTML: (c.tag ? `<p><strong>${esc(c.tag)}</strong></p>` : '') + `<p>${esc(c.text)}</p>` },
    groupButton: { showButton: false },
  })),
});

function plan(slug, contentId) {
  const secs = d[slug].sections;
  const hero = secs[0];
  const cta = secs.find((s, i) => i > 0 && s.footerLinks) || null;
  const content = secs.filter((s, i) => i > 0 && s !== cta);
  const set = (moduleId, obj) => ({ action: 'SET_MODULE_FIELDS', contentId, moduleId, fieldOverridesJson: JSON.stringify(obj) });
  const ops = [];
  const removes = [];

  ops.push(set(HERO.eyebrow, { richTextContentHTML: `<p>${pill(hero.eyebrow || d[slug].label)}</p>` }));
  ops.push(set(HERO.h1, { headingAndTextHeading: hero.title }));
  const lead = hero.blocks.filter((b) => ![hero.eyebrow, hero.title, ...hero.buttons.map((x) => x.text)].includes(b.text)).map((b) => `<p style="font-size:18px;">${esc(b.text)}</p>`).join('');
  ops.push(set(HERO.lead, { richTextContentHTML: lead || '<p></p>' }));
  if (hero.buttons.length) ops.push(set(HERO.button, { groupButtons: hero.buttons.slice(0, 2).map(button) }));
  else removes.push(HERO.button);

  SLOTS.forEach((slot, i) => {
    const s = content[i];
    if (!s) { removes.push({ section: slot.h2 }); return; }
    const label = (s.number ? `<span style="color:#a8adba;font-size:12px;letter-spacing:0.2em;">${esc(s.number)}</span> &nbsp;` : '') + (s.eyebrow ? pill(s.eyebrow) : '');
    if (label) ops.push(set(slot.label, { richTextContentHTML: `<p>${label}</p>` })); else removes.push(slot.label);
    if (s.title) ops.push(set(slot.h2, { headingAndTextHeading: s.title })); else removes.push(slot.h2);
    const body = bodyHtml(s) + (s.buttons.length ? '<p>' + s.buttons.map((b) => `<a href="${esc(b.href)}"><strong>${esc(b.text)} →</strong></a>`).join(' &nbsp; ') + '</p>' : '');
    if (body) ops.push(set(slot.body, { richTextContentHTML: body })); else removes.push(slot.body);
    const a = s.cards.slice(0, 4), b = s.cards.slice(4, 8);
    if (a.length) ops.push(set(slot.cardsA, cardsField(a, 0))); else removes.push(slot.cardsA);
    if (b.length) ops.push(set(slot.cardsB, cardsField(b, 4))); else removes.push(slot.cardsB);
  });

  if (cta) {
    ops.push(set(CTA.h2, { headingAndTextHeading: cta.title }));
    const t = cta.blocks.filter((b) => ![cta.title, ...cta.buttons.map((x) => x.text)].includes(b.text)).map((b) => `<p>${esc(b.text)}</p>`).join('');
    ops.push(set(CTA.text, { richTextContentHTML: t || '<p></p>' }));
    if (cta.buttons.length) ops.push(set(CTA.button, { groupButtons: cta.buttons.slice(0, 2).map(button) }));
  } else removes.push({ section: CTA.h2 });

  const title = `${d[slug].label} | Momentum Data Solutions`;
  let desc = (lead.replace(/<[^>]+>/g, '') || hero.title); if (desc.length > 160) desc = desc.slice(0, 157).replace(/\s+\S*$/, '') + '…';
  ops.push({ action: 'SET_METADATA', contentId, htmlTitle: title, metaDescription: desc });

  const batches = [];
  for (let i = 0; i < ops.length; i += 9) batches.push(ops.slice(i, i + 9));
  return { batches, removes, extra: content.slice(3).map((s) => s.title) };
}

module.exports = { plan };
if (require.main === module) {
  const [slug, id] = process.argv.slice(2);
  const p = plan(slug, Number(id));
  fs.writeFileSync(`out/plan-${slug}.json`, JSON.stringify(p, null, 1));
  console.log(slug, 'batches', p.batches.length, 'ops', p.batches.flat().length, 'removes', JSON.stringify(p.removes), 'overflow', JSON.stringify(p.extra));
}
