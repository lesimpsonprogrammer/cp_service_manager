const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  await p.goto('file://' + process.cwd() + '/page_036c60.html'); await p.waitForTimeout(9000);
  await p.addStyleTag({ content: '.cloud-artwork > span { display: none !important; }' });
  const boxes = await p.evaluate(() => {
    const root = document.querySelector('.hdr-bar').parentElement.parentElement;
    const secs = [...root.children].filter(c => c.getAttribute('data-dc-tpl') === '68');
    const pick = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; };
    const out = {};
    const clouds = [...document.querySelectorAll('.cloud-artwork')];
    if (clouds[0]) out.hero = pick(clouds[0]);
    if (clouds[1]) out.cpsm = pick(clouds[1]);
    // platform mockup: largest bordered box in section index 4
    const s4 = secs[4]; const cand = [...s4.querySelectorAll('div')].filter(d => d.getBoundingClientRect().width > 450 && d.getBoundingClientRect().height > 300);
    cand.sort((a,b) => a.getBoundingClientRect().width*a.getBoundingClientRect().height - b.getBoundingClientRect().width*b.getBoundingClientRect().height);
    const mock = cand.filter(d => /mapping\/employee-master/.test(d.innerText) && !/One platform/.test(d.innerText))[0]; if (mock) out.platform = pick(mock);
    // blog/newsletter preview in section 5
    const s5 = secs[5]; const c5 = [...s5.querySelectorAll('div')].filter(d => /clean-data/.test(d.innerText) && d.getBoundingClientRect().width > 300 && d.getBoundingClientRect().height > 250);
    c5.sort((a,b) => a.getBoundingClientRect().width - b.getBoundingClientRect().width); if (c5[0]) out.insights = pick(c5[0]);
    // exec brief section card area
    const s2 = secs[2]; const c2 = [...s2.querySelectorAll('div')].filter(d => d.getBoundingClientRect().width > 300 && d.getBoundingClientRect().height > 200 && !/Executive Brief\n/.test(''));
    out.brief = pick(s2);
    return out;
  });
  console.log(JSON.stringify(boxes));
  for (const [k, r] of Object.entries(boxes)) {
    await p.screenshot({ path: `art/home-${k}.png`, clip: { x: r.x, y: r.y, width: r.w, height: r.h }, fullPage: true });
  }
  await b.close();
})();
