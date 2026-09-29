const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const pages = JSON.parse(fs.readFileSync('out/pages.json'));
const logos = JSON.parse(fs.readFileSync('out/logos.json'));
const MENU_ID = 383035789010;
const ASSETS = 'https://cdn.jsdelivr.net/gh/lesimpsonprogrammer/cp_service_manager@0b0fc41ec14a5c5bda81a4fafe55e2fd660e1306/assets';
const HEADER_LOGO = ASSETS + '/momentum-logo-mark.svg';
const FOOTER_LOGO = ASSETS + '/momentum-logo-stacked-white.png';
const CONTACT_FORM = 'c2b093cd-c348-4fb5-b471-78237cb1fc2e';
const BRIEF_FORM = 'b0a557fc-ba9a-488d-84fe-fe3cbd663c34';

const LINKS = { 'home':'/', 'about':'/about', 'solutions':'/data-management', 'resources':'/support-tools',
  'relentless commitment':'/relentless-commitment', 'blog':'/blog', 'contact':'/contact', 'terms of use':'/terms-of-use',
  'download the brief':'/executive-brief#get-the-brief', 'download now':'/executive-brief#get-the-brief', 'learn more':'/payroll-processing' };
const linkFor = (t) => LINKS[(t||'').trim().toLowerCase()] || '/contact';

// glossary terms
const gl = fs.readFileSync('out/glossary.txt','utf8').split('\n').map(s=>s.trim()).filter(Boolean);
const gi = gl.findIndex(l => /^Showing \d+ of \d+ terms/.test(l));
const terms = [];
for (let i = gi + 1; i + 2 < gl.length && !/^Search report/.test(gl[i]); i += 3) terms.push({ t: gl[i], c: gl[i+1], d: gl[i+2] });

(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const transform = async (html, opts = {}) => {
    await p.setContent('<div id="r">' + html + '</div>');
    return await p.evaluate(({ LINKS, opts, terms }) => {
      const linkFor = (t) => LINKS[(t||'').trim().toLowerCase()] || '/contact';
      const r = document.getElementById('r');
      const outer = r.firstElementChild; outer.classList.add('mds-sec');
      if (opts.anchor) outer.id = opts.anchor;
      // glossary rebuild
      if (opts.glossary) {
        const all = [...r.querySelectorAll('*')];
        const first = all.find(e => e.children.length === 0 && e.textContent.trim() === 'Data extraction');
        let card = first; while (card.parentElement && !card.parentElement.textContent.includes('Data transformation')) card = card.parentElement;
        const grid = card.parentElement;
        const tpl = card.cloneNode(true);
        grid.innerHTML = '';
        grid.id = 'mds-gloss-grid';
        for (const t of terms) {
          const c = tpl.cloneNode(true);
          const leaves = [...c.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim());
          leaves[0].textContent = t.t; leaves[1].textContent = t.c; leaves[2].textContent = t.d;
          c.setAttribute('data-cat', t.c.toLowerCase()); c.classList.add('mds-term');
          grid.appendChild(c);
        }
        let showing = all.find(e => e.children.length === 0 && /^Showing \d+ of/.test(e.textContent.trim()));
        if (showing && showing.classList.contains('sc-interp')) showing = showing.parentElement;
        if (showing) { showing.id = 'mds-gloss-count'; showing.textContent = `Showing ${terms.length} of ${terms.length} terms`; }
        const inp = r.querySelector('input'); if (inp) { inp.id = 'mds-gloss-search'; inp.setAttribute('type','search'); inp.setAttribute('aria-label','Search the glossary'); }
        r.querySelectorAll('[data-link-text]').forEach(e => {
          const t = e.getAttribute('data-link-text');
          if (/^(All|Data|HR|Payroll|Project Management)$/.test(t)) { e.setAttribute('data-filter', t === 'All' ? 'all' : t.toLowerCase()); e.classList.add('mds-chip'); e.removeAttribute('data-link-text'); e.style.cursor = 'pointer'; }
          else if (/^Show \d+ more|^Search report/.test(t)) e.remove();
        });
      }
      // clickable divs/spans -> anchors
      r.querySelectorAll('[data-link-text]').forEach(e => {
        const a = document.createElement('a');
        for (const at of e.attributes) if (at.name !== 'data-link-text') a.setAttribute(at.name, at.value);
        a.setAttribute('href', linkFor(e.getAttribute('data-link-text')));
        a.style.textDecoration = 'none';
        if (getComputedStyle(e).display === 'inline') a.style.display = 'inline-block';
        a.classList.add('mds-link');
        while (e.firstChild) a.appendChild(e.firstChild);
        e.replaceWith(a);
      });
      r.querySelectorAll('.sc-interp').forEach(e => e.replaceWith(...e.childNodes));
      r.querySelectorAll('[class]').forEach(e => { const k = [...e.classList].filter(c => !/^sc/.test(c)); if (k.length) e.className = k.join(' '); else e.removeAttribute('class'); });
      // split for form sections: return left html + section style + divider html
      if (opts.formSplit) {
        const inp = r.querySelector('input,textarea');
        let card = inp; while (card.parentElement && !/auto-fit/.test(card.parentElement.getAttribute('style') || '')) card = card.parentElement;
        const gridEl = card.parentElement;
        const left = [...gridEl.children].find(c => c !== card);
        const cardStyle = card.getAttribute('style');
        const cardTitle = (card.querySelector('h3')||{}).textContent || '';
        const cardNote = [...card.querySelectorAll('p')].map(x => x.outerHTML).join('');
        const divider = outer.firstElementChild.firstElementChild.outerHTML; // first row (numbered divider)
        const bg = getComputedStyle(outer).backgroundColor;
        return { split: true, left: left.outerHTML, divider, bg, cardStyle, cardTitle, cardNote: card.querySelector('h3') ? '' : cardNote };
      }
      return { html: r.innerHTML };
    }, { LINKS, opts, terms });
  };

  const esc = (s) => s.replace(/>\s+</g, '> <').replace(/\s{2,}/g, ' ').replace(/\{\{/g, '{ {').replace(/\{%/g, '{ %');
  const rgb = (s) => { const m = s.match(/[\d.]+/g).map(Number); return `{r:${m[0]},g:${m[1]},b:${m[2]},a:${m[3] ?? 1}}`; };
  const rt = (html, label) => `{% dnd_module path="@hubspot/rich_text" label="${label}" %}{% module_attribute "html" %}${esc(html)}{% end_module_attribute %}{% end_dnd_module %}`;

  const CSS = fs.readFileSync('site.css', 'utf8');
  const HEADER = fs.readFileSync('header.hubl', 'utf8').replace('__LOGO__', HEADER_LOGO).replace('__MENU_ID__', MENU_ID);
  const FOOTER_HTML = logos.footerHtml.replace(/ data-dc-tpl="\d+"/g, '').replace(/ class="scp[a-z0-9]*"/g, '')
    .replace(/<img[^>]*>/, `<img src="${FOOTER_LOGO}" alt="Momentum Data Solutions" style="width: 150px; height: 139px; display: block;">`)
    .replace('<div style="background: rgb(32, 42, 80); padding: 56px 64px 44px;">', '<div class="mds-footer" style="background: rgb(32, 42, 80); padding: 56px 64px 44px;">');

  const summary = {};
  for (const [slug, pg] of Object.entries(pages)) {
    let body = '';
    for (const [i, s] of pg.sections.entries()) {
      const isForm = (slug === 'contact' || slug === 'executive-brief') && i === 1;
      const res = await transform(s.html, { glossary: slug === 'data-glossary' && i === 1, formSplit: isForm, anchor: isForm && slug === 'executive-brief' ? 'get-the-brief' : null });
      const label = i === 0 ? 'Hero' : `Section ${i}`;
      if (res.split) {
        const formId = slug === 'contact' ? CONTACT_FORM : BRIEF_FORM;
        const title = res.cardTitle || '';
        const msg = slug === 'contact' ? 'Thanks — a member of the Momentum team will follow up within two business days.' : 'Thanks — check your inbox for the Executive Brief.';
        const dark = slug === 'executive-brief';
        body += `{% dnd_section background_color=${rgb(res.bg)}, max_width=1328, padding={ default: { top: 54, right: 64, bottom: 0, left: 64 }, mobile: { top: 40, right: 20, bottom: 0, left: 20 } } %}${rt(`<div${dark ? ' id="get-the-brief"' : ''}>${res.divider}</div>`, label + ' divider')}{% end_dnd_section %}\n`;
        body += `{% dnd_section background_color=${rgb(res.bg)}, max_width=1328, vertical_alignment="MIDDLE", padding={ default: { top: 0, right: 64, bottom: 76, left: 64 }, mobile: { top: 0, right: 20, bottom: 52, left: 20 } } %}`
          + `{% dnd_column offset=0, width=6 %}{% dnd_row %}${rt(res.left, label + ' text')}{% end_dnd_row %}{% end_dnd_column %}`
          + `{% dnd_column offset=6, width=6 %}{% dnd_row %}{% dnd_module path="@hubspot/form" label="${label} form" title="${title}" form={ form_id: "${formId}", response_type: "inline", message: "${msg}", form_type: "HUBSPOT" } %}{% end_dnd_module %}{% end_dnd_row %}${res.cardNote ? `{% dnd_row %}${rt(res.cardNote, label + ' form note')}{% end_dnd_row %}` : ''}{% end_dnd_column %}`
          + `{% end_dnd_section %}\n`;
        summary[slug] = (summary[slug] || '') + ` [form ${dark ? 'dark' : 'light'}]`;
      } else {
        body += `{% dnd_section full_width=true, padding={ default: { top: 0, right: 0, bottom: 0, left: 0 } } %}${rt(res.html, label)}{% end_dnd_section %}\n`;
      }
    }
    const extraScript = slug === 'data-glossary' ? fs.readFileSync('glossary.js', 'utf8') : '';
    const tpl = `<!--
  templateType: page
  isAvailableForNewContent: true
  label: Momentum – ${pg.label}
-->
<!doctype html>
<html lang="{{ html_lang }}">
<head>
  <meta charset="utf-8">
  <title>{{ content.html_title }}</title>
  <meta name="description" content="{{ content.meta_description }}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  {{ standard_header_includes }}
  <style>
${CSS}
  </style>
</head>
<body class="mds-page mds-${slug}">
${HEADER}
<main id="main-content" class="mds-main">
{% dnd_area "main_content" label="Page content" %}
${body}{% end_dnd_area %}
</main>
{% module_block module "site_footer" path="@hubspot/rich_text" label="Footer" %}{% module_attribute "html" %}${esc(FOOTER_HTML)}{% end_module_attribute %}{% end_module_block %}
${extraScript}
{{ standard_footer_includes }}
</body>
</html>
`;
    let outTpl = tpl;
    if (slug === 'data-glossary' || slug === 'terms-of-use') {
      const m = outTpl.match(/\{% dnd_area[\s\S]*\{% end_dnd_area %\}/)[0];
      const map = new Map(); let n = 0;
      const m2 = m.replace(/ style="([^"]*)"/g, (all, st) => { if (!map.has(st)) map.set(st, 'm' + (n++).toString(36)); return ` class="${map.get(st)}"`; })
        .replace(/ class="([^"]*)" class="([^"]*)"/g, ' class="$1 $2"').replace(/ class="([^"]*)"([^>]*?) class="([^"]*)"/g, ' class="$1 $3"$2');
      const css = [...map].map(([st, c]) => `.mds-main .${c}{${st}}`).join('\n');
      outTpl = outTpl.replace(m, m2).replace('  </style>', css + '\n  </style>');
    }
    fs.writeFileSync(`out/tpl/${slug}.html`, outTpl);
    console.log(slug, outTpl.length, summary[slug] || '');
  }
  await b.close();
})();
