// Turn each extracted design section into structured content for Elevate modules:
// { number, eyebrow, title, titleAccent, blocks:[{tag,text,href?}], cards:[{title,text,tag}], buttons:[{text,href}] }
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const pages = Object.assign({}, JSON.parse(fs.readFileSync('out/home.json')), JSON.parse(fs.readFileSync('out/pages.json')));
const LINKS = {
  'home': '/', 'about': '/about', 'solutions': '/data-management', 'resources': '/support-tools',
  'relentless commitment': '/relentless-commitment', 'blog': '/blog', 'contact': '/contact', 'terms of use': '/terms-of-use',
  'download the brief': '/executive-brief', 'download now': '/executive-brief', 'learn more': '/payroll-processing',
  'explore cloud performance': '/cloud-performance', 'get started': 'https://app.cpservicemanager.com',
  'data management': '/data-management', 'project management': '/implementation', 'human resources': '/human-resources',
  'managed payroll services': '/managed-payroll', 'join': '/blog'
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const out = {};
  for (const [slug, pg] of Object.entries(pages)) {
    const secs = [];
    for (const s of pg.sections) {
      await p.setContent('<div id="r">' + s.html + '</div>');
      secs.push(await p.evaluate(({ LINKS }) => {
        const linkFor = (t) => LINKS[(t || '').trim().toLowerCase()] || '/contact';
        const root = document.getElementById('r');
        const txt = (e) => (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim();
        const st = (e) => e.getAttribute && (e.getAttribute('style') || '') || '';
        const used = new Set();
        const mark = (e) => { used.add(e); e.querySelectorAll('*').forEach((x) => used.add(x)); };
        const res = { number: '', eyebrow: '', title: '', titleAccent: '', blocks: [], cards: [], buttons: [], footerLinks: false };

        // Footer link row (Home About Solutions ...) is site chrome: drop it.
        [...root.querySelectorAll('div')].forEach((e) => {
          if (!used.has(e) && e.children.length >= 6 && /^Home ?About ?Solutions/.test(txt(e))) { mark(e); res.footerLinks = true; }
        });
        // Numbered divider ("01") row.
        const num = [...root.querySelectorAll('span')].find((e) => /^\d\d$/.test(txt(e)));
        if (num) { res.number = txt(num); let row = num; while (row.parentElement && !/display: flex/.test(st(row))) row = row.parentElement; mark(row); }
        // Eyebrow pill.
        const pill = [...root.querySelectorAll('span')].find((e) => !used.has(e) && /999px/.test(st(e)) && txt(e));
        if (pill) { res.eyebrow = txt(pill); mark(pill); }
        // Title.
        const h = [...root.querySelectorAll('h1, h2')].find((e) => !used.has(e));
        if (h) {
          res.title = txt(h);
          const acc = [...h.querySelectorAll('span')].find((x) => /235, 84, 0/.test(st(x)));
          if (acc) res.titleAccent = txt(acc);
          mark(h);
        }
        // Cards: bordered boxes that contain their own heading.
        const cardEls = [...root.querySelectorAll('div')].filter((e) => /border: 1(\.5)?px solid/.test(st(e)) && e.querySelector('h3, h4'));
        const top = cardEls.filter((e) => !cardEls.some((o) => o !== e && o.contains(e)));
        if (top.length >= 2) {
          for (const c of top) {
            const t = c.querySelector('h3, h4');
            const leaves = [...c.querySelectorAll('*')].filter((x) => !t.contains(x) && x.children.length === 0 && txt(x));
            const tagEl = leaves.find((x) => /^[A-Z0-9][A-Z0-9 ·&/+-]{2,}$/.test(txt(x)) && txt(x) === txt(x).toUpperCase());
            const body = leaves.filter((x) => x !== tagEl).map(txt);
            res.cards.push({ title: txt(t), text: body.join(' '), tag: tagEl ? txt(tagEl) : '' });
            mark(c);
          }
        }
        // Buttons: clickable divs/spans and padded anchors.
        root.querySelectorAll('[data-link-text]').forEach((e) => {
          if (used.has(e)) return;
          const t = txt(e);
          if (t) res.buttons.push({ text: t, href: linkFor(e.getAttribute('data-link-text')) });
          mark(e);
        });
        root.querySelectorAll('a[href]').forEach((a) => {
          if (used.has(a)) return;
          if (/padding: \d+px \d+px/.test(st(a)) && txt(a)) { res.buttons.push({ text: txt(a), href: a.getAttribute('href') }); mark(a); }
        });
        // Remaining text, in document order.
        const inline = new Set(['SPAN', 'STRONG', 'EM', 'B', 'I', 'A', 'BR', 'svg', 'SVG', 'path', 'circle', 'rect']);
        const walk = (e) => {
          if (used.has(e)) return;
          const isTextual = ['P', 'H3', 'H4', 'H5', 'LI', 'TD', 'TH'].includes(e.tagName) ||
            (e.children.length === 0 && txt(e)) ||
            (e.children.length && [...e.children].every((c) => inline.has(c.tagName)) && txt(e));
          if (isTextual) {
            const t = txt(e);
            const prev = e.previousElementSibling;
            const bullet = (prev && (/50%/.test(st(prev)) || prev.tagName.toLowerCase() === 'svg' || (prev.querySelector && prev.querySelector('svg') && !txt(prev)))) || e.tagName === 'LI';
            const a = e.tagName === 'A' ? e : e.querySelector('a[href]');
            res.blocks.push({ tag: /^H[345]$/.test(e.tagName) ? 'h3' : bullet ? 'li' : 'p', text: t, href: a ? a.getAttribute('href') : undefined, linkText: a ? txt(a) : undefined });
            mark(e);
            return;
          }
          [...e.children].forEach(walk);
        };
        walk(root);
        return res;
      }, { LINKS }));
    }
    out[slug] = { label: pg.label, sections: secs };
  }
  fs.writeFileSync('out/struct.json', JSON.stringify(out, null, 1));
  await b.close();
})();
