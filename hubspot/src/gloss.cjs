const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto('file://' + process.cwd() + '/page_036c60.html');
  await p.waitForTimeout(6000);
  await p.evaluate(() => { [...document.querySelectorAll('div,a,button,li')].filter(e => e.getBoundingClientRect().left < 236 && e.innerText && e.innerText.split('\n')[0].trim() === 'Data Glossary').pop().click(); });
  await p.waitForTimeout(2000);
  for (let i = 0; i < 6; i++) {
    const n = await p.evaluate(() => { const el = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /^Show \d+ more/.test((e.textContent||'').trim())); if (el) { el.click(); return 1; } return 0; });
    if (!n) break; await p.waitForTimeout(800);
  }
  const terms = await p.evaluate(() => {
    const root = document.querySelector('.hdr-bar').parentElement.parentElement;
    const sec = [...root.children].filter(c => c.getAttribute('data-dc-tpl') === '68')[1];
    const txt = sec.innerText; return txt;
  });
  fs.writeFileSync('out/glossary.txt', terms);
  console.log(terms.slice(0, 600)); console.log('...', terms.length);
  await b.close();
})();
