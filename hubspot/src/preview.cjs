const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  for (const s of process.argv.slice(2)) {
    let h = fs.readFileSync(`out/tpl/${s}.html`, 'utf8');
    h = h.replace(/\{% for item[\s\S]*?\{% endfor %\}\s*\{% endif %\}\s*\{% endfor %\}/, '<a class="mds-item" href="#">Home</a><a class="mds-item" href="#">About</a>');
    h = h.replace(/\{% module "header_logo"[^%]*%\}/, '<img src="' + JSON.parse(fs.readFileSync('out/logos.json')).header + '">');
    h = h.replace(/\{% module "header_cta"[^%]*%\}/, '<a class="mds-cta" href="/contact">Contact us</a>');
    h = h.replace(/\{% dnd_module path="@hubspot\/form"[^%]*%\}/g, '<div class="hs_cos_wrapper_type_form"><h3>FORM</h3><form class="hs-form"><div class="hs-form-field"><label>Email</label><input class="hs-input"></div><input type="submit" class="hs-button" value="Submit"></form></div>');
    h = h.replace(/\{% dnd_column[^%]*width=6[^%]*%\}/g, '<div class="span6 dnd-column">').replace(/\{% end_dnd_column %\}/g, '</div>');
    h = h.replace(/\{% dnd_section[^%]*background_color=\{r:(\d+),g:(\d+),b:(\d+)[^%]*%\}/g, '<div class="dnd-section row-fluid" style="background:rgb($1,$2,$3);padding:0 64px">').replace(/\{% end_dnd_section %\}/g, '</div>');
    h = h.replace(/\{%[\s\S]*?%\}/g, '').replace(/\{\{[\s\S]*?\}\}/g, '');
    fs.writeFileSync(`out/prev_${s}.html`, h);
    await p.goto('file://' + process.cwd() + `/out/prev_${s}.html`); await p.waitForTimeout(800);
    await p.screenshot({ path: `out/prev_${s}.png`, fullPage: true });
  }
  await b.close();
})();
