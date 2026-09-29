const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
const PAGES = {
  'About':'about','Contact us':'contact','Community +':'community-plus','Community + Membership':'community-membership',
  'Cloud Performance':'cloud-performance','Data Management':'data-management','Implementation':'implementation',
  'Human Resources':'human-resources','Managed Payroll':'managed-payroll','Payroll Processing':'payroll-processing',
  'Year-end Reporting':'year-end-reporting','Community':'community','HIPAA':'hipaa','Data Handling Policy':'data-handling-policy',
  'Data Security & Governance':'data-security-governance','Data Glossary':'data-glossary','Relentless Commitment':'relentless-commitment',
  'Executive Brief':'executive-brief','Data API’s':'data-apis','Data Webhooks':'data-webhooks','Data Connectors':'data-connectors',
  'Support Tools':'support-tools','Terms of Use':'terms-of-use'
};
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto('file://' + process.cwd() + '/page_036c60.html');
  await p.waitForTimeout(6000);
  const result = {};
  for (const [label, slug] of Object.entries(PAGES)) {
    await p.evaluate((l) => { [...document.querySelectorAll('div,a,button,li')].filter(e => e.getBoundingClientRect().left < 236 && e.innerText && e.innerText.split('\n')[0].trim() === l).pop().click(); }, label);
    await p.waitForTimeout(2200);
    const data = await p.evaluate(async (PAGES) => {
      const toData = async (src) => { try { const r = await fetch(src); const bl = await r.blob(); return await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(bl); }); } catch { return src; } };
      const root = document.querySelector('.hdr-bar').parentElement.parentElement;
      const kids = [...root.children];
      const secs = kids.filter(c => c.getAttribute('data-dc-tpl') === '68');
      const out = [];
      const clickables = [];
      for (const s of secs) {
        const c = s.cloneNode(true);
        // map clickable (cursor:pointer) non-anchor elements in the original to anchors in the clone
        const orig = [...s.querySelectorAll('*')], cl = [...c.querySelectorAll('*')];
        const imgs = [];
        for (let i = 0; i < orig.length; i++) {
          const o = orig[i], k = cl[i];
          if (o.tagName === 'IMG' && o.src.startsWith('blob:')) imgs.push([k, o.src]);
          const cs = getComputedStyle(o);
          const parentPointer = o.parentElement && getComputedStyle(o.parentElement).cursor === 'pointer';
          if (cs.cursor === 'pointer' && !parentPointer && o.tagName !== 'A' && o.tagName !== 'INPUT' && !o.closest('a')) {
            const t = (o.innerText || '').trim().split('\n')[0];
            k.setAttribute('data-link-text', t);
            clickables.push(t);
          }
        }
        for (const [k, src] of imgs) k.setAttribute('src', await toData(src));
        c.querySelectorAll('*').forEach(e => { [...e.attributes].forEach(a => { if (a.name.startsWith('data-dc') || a.name.startsWith('data-sc')) e.removeAttribute(a.name); }); });
        c.removeAttribute('data-dc-tpl');
        out.push({ text: (s.innerText || '').slice(0, 80), html: c.outerHTML });
      }
      return { sections: out, clickables };
    }, PAGES);
    result[slug] = { label, ...data };
    console.log(slug, data.sections.length, data.sections.map(s => s.html.length).join(','), '| clicks:', [...new Set(data.clickables)].join(' ; '));
  }
  // logos
  const logos = await p.evaluate(async () => {
    const toData = async (src) => { const r = await fetch(src); const bl = await r.blob(); return await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(bl); }); };
    return { header: await toData(document.querySelector('.hdr-bar img').src), footer: await toData(document.querySelector('[data-dc-tpl="766"] img').src),
      footerHtml: document.querySelector('[data-dc-tpl="766"]').outerHTML, headerHtml: document.querySelector('.hdr-bar').parentElement.outerHTML };
  });
  fs.writeFileSync('out/pages.json', JSON.stringify(result));
  fs.writeFileSync('out/logos.json', JSON.stringify(logos));
  console.log('logo sizes', logos.header.length, logos.footer.length, logos.header.slice(0,40), logos.footer.slice(0,40));
  await b.close();
})();
