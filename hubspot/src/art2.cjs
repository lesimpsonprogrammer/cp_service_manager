const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  await p.goto('file://' + process.cwd() + '/page_036c60.html'); await p.waitForTimeout(9000);
  const r = await p.evaluate(() => {
    const el = [...document.querySelectorAll('div')].filter(d => (d.innerText||'').startsWith('app.momentumdatasolutions.com/mapping') ).sort((a,b)=>a.getBoundingClientRect().width-b.getBoundingClientRect().width).pop();
    const q = el.getBoundingClientRect(); return { x: q.left + scrollX, y: q.top + scrollY, w: q.width, h: q.height };
  });
  console.log(JSON.stringify(r));
  await p.screenshot({ path: 'art/home-platform.png', clip: { x: r.x, y: r.y, width: r.w, height: r.h }, fullPage: true });
  await b.close();
})();
