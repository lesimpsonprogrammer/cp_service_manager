/* <jaren-vortex> — ambient data-vortex background for Jaren CP chat.
 *
 *   <script src="jaren-vortex.js"></script>
 *   <jaren-vortex theme="dark"></jaren-vortex>       // or theme="light"
 *
 * Attributes (all optional, live-reactive):
 *   theme="dark|light"     palette                                (default dark)
 *   opacity="0.62"         canvas opacity — keep composer legible  (default 0.62)
 *   speed="1"              rotation multiplier                    (default 1)
 *   density="620"          particle count                          (default 620)
 *   data="on|off"          glyph particles mixed into the stars    (default on)
 *   swell="on|off"         slow light / dark swells                (default on)
 *   chaos="on|off"         periodic disorganized phase             (default on)
 *   transparent            paint no ground; the page shows through
 *
 * Position it yourself (it fills its container; give it position:absolute; inset:0
 * and a lower z-index than the chat, plus pointer-events:none).
 *
 * Reorganize on demand — call when Jaren enters the chat:
 *   document.querySelector('jaren-vortex').jarenEnters();
 * or dispatch anywhere:  window.dispatchEvent(new Event('jaren-enters'))
 */
(() => {
  const GLYPHS = ['0', '1', '{', '}', '<', '>', '#', '=', ';', '/', '·', '01', '10'];
  const THEMES = {
    dark: {
      bg: '#07070a', comp: 'lighter',
      cloud: ['rgba(150,170,220,0.16)', 'rgba(255,220,190,0.10)', 'rgba(120,140,200,0.13)'],
      stars: ['#ffffff', '#cfe0ff', '#ffd7ae', '#ec3013'],
      weights: [0.62, 0.24, 0.12, 0.02],
      core: 'rgba(255,255,255,', glyph: 'rgba(210,225,255,', ring: '#cfe0ff'
    },
    light: {
      bg: '#f3f2f2', comp: 'source-over',
      cloud: ['rgba(32,30,29,0.055)', 'rgba(236,48,19,0.035)', 'rgba(32,30,29,0.045)'],
      stars: ['#201e1d', '#4a4644', '#6f6a67', '#ec3013'],
      weights: [0.5, 0.28, 0.18, 0.04],
      core: 'rgba(32,30,29,', glyph: 'rgba(32,30,29,', ring: '#ec3013'
    }
  };

  const pickIdx = (w) => { let r = Math.random(), i = 0; while (i < w.length - 1 && r > w[i]) { r -= w[i]; i++; } return i; };

  function sprite(color, dark) {
    const s = 48, c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, dark ? '#ffffff' : color);
    grd.addColorStop(0.18, color);
    grd.addColorStop(0.5, color.length === 7 ? color + '55' : color);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.beginPath(); g.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2); g.fill();
    return c;
  }

  class JarenVortex extends HTMLElement {
    static get observedAttributes() { return ['theme', 'opacity', 'speed', 'density', 'data', 'swell', 'chaos', 'transparent']; }

    connectedCallback() {
      if (this._on) return;
      this._on = true;
      const root = this.attachShadow ? (this.shadowRoot || this.attachShadow({ mode: 'open' })) : this;
      root.innerHTML = '<style>:host{display:block;position:relative;overflow:hidden}canvas{position:absolute;inset:0;width:100%;height:100%;display:block}</style><canvas></canvas>';
      this.canvas = root.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.order = 1; this.mode = 'ordered'; this.until = 10; this.flash = 0; this.last = 0;
      this._build();
      this._size();
      this.ro = new ResizeObserver(() => this._size());
      this.ro.observe(this);
      this._joinHandler = () => this.jarenEnters();
      window.addEventListener('jaren-enters', this._joinHandler);
      this.t0 = performance.now();
      const tick = (now) => {
        const t = (now - this.t0) / 1000;
        const dt = Math.min(0.05, t - this.last);
        this.last = t;
        this._clock(t, dt);
        this._draw(t, dt);
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }

    disconnectedCallback() {
      this._on = false;
      cancelAnimationFrame(this.raf);
      if (this.ro) this.ro.disconnect();
      window.removeEventListener('jaren-enters', this._joinHandler);
      clearTimeout(this._t);
    }

    attributeChangedCallback() { if (this._on) this._build(); }

    get opts() {
      const n = (a, d) => { const v = parseFloat(this.getAttribute(a)); return isNaN(v) ? d : v; };
      const b = (a, d) => { const v = this.getAttribute(a); return v == null ? d : !(v === 'off' || v === 'false'); };
      return {
        theme: this.getAttribute('theme') === 'light' ? 'light' : 'dark',
        intensity: n('opacity', 0.62), speed: n('speed', 1), density: Math.round(n('density', 620)),
        dataMode: b('data', true), swell: b('swell', true), chaos: b('chaos', true),
        transparent: this.hasAttribute('transparent')
      };
    }

    _build() {
      const o = this.opts;
      const th = THEMES[o.theme];
      this.canvas.style.opacity = String(o.intensity);
      if (this._theme !== o.theme) {
        this._theme = o.theme;
        this.sprites = th.stars.map((c) => sprite(c, o.theme === 'dark'));
        this.clouds = Array.from({ length: 5 }, (_, i) => ({
          x: Math.random(), y: Math.random(), r: 0.28 + Math.random() * 0.4,
          c: th.cloud[i % th.cloud.length], dx: (Math.random() - 0.5) * 0.012,
          dy: (Math.random() - 0.5) * 0.009, ph: Math.random() * 6.28
        }));
      }
      if (!this.parts || this.parts.length !== o.density) this.parts = this._parts(o.density, th);
    }

    _parts(n, th) {
      const arms = 3, out = [];
      for (let i = 0; i < n; i++) {
        const core = i % 9 === 0;
        const t = core ? Math.random() * 0.09 : Math.pow(Math.random(), 0.62) * 0.98 + 0.02;
        out.push({
          t,
          a: (i % arms) * (Math.PI * 2 / arms) + t * 3.1 + (Math.random() - 0.5) * (0.55 * (1 - t) + 0.22),
          w: 0.055 + 0.115 / (0.3 + t * 1.9),
          size: (core ? 0.7 : 0.55 + Math.random() * 1.5) * (t < 0.35 ? 0.85 : 1),
          ci: pickIdx(th.weights), tw: 0.4 + Math.random() * 2.2, ph: Math.random() * 6.28,
          base: 0.35 + Math.random() * 0.65,
          ox: 0, oy: 0, vx: 0, vy: 0,
          wj: (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 3),
          spark: Math.random() < 0.05,
          glyph: Math.random() < 0.09 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : null
        });
      }
      return out;
    }

    jarenEnters() {
      this.mode = 'reform';
      this.until = this.last + 14 + Math.random() * 10;
      this.flash = 1;
      this.dispatchEvent(new CustomEvent('reorganize', { bubbles: true }));
    }

    _clock(t, dt) {
      this.flash = Math.max(0, this.flash - dt * 0.5);
      if (!this.opts.chaos) { this.order += (1 - this.order) * Math.min(1, dt * 2); return; }
      if (this.mode === 'ordered') {
        this.order += (1 - this.order) * Math.min(1, dt * 2);
        if (t > this.until) { this.mode = 'scatter'; this.until = t + 7 + Math.random() * 6; }
      } else if (this.mode === 'scatter') {
        this.order += (0 - this.order) * Math.min(1, dt * 0.85);
        if (t > this.until) this.jarenEnters();
      } else {
        this.order += (1 - this.order) * Math.min(1, dt * 1.6);
        if (this.order > 0.985) { this.order = 1; this.mode = 'ordered'; this.until = t + 12 + Math.random() * 10; }
      }
    }

    _size() {
      const r = this.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
      this.canvas.width = this.w * dpr; this.canvas.height = this.h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    _draw(t, dt) {
      const o = this.opts, th = THEMES[o.theme], { ctx, w, h } = this;
      if (!w || !h) return;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      if (o.transparent) ctx.clearRect(0, 0, w, h);
      else { ctx.fillStyle = th.bg; ctx.fillRect(0, 0, w, h); }

      const swell = o.swell
        ? 0.88 + 0.24 * Math.sin(t * 0.36) + 0.14 * Math.sin(t * 0.14 + 1.3) - 0.13 * Math.pow(Math.max(0, Math.sin(t * 0.078 - 0.6)), 3)
        : 1;
      const S = Math.max(0.5, Math.min(1.35, swell));
      const cx = w * 0.5 + Math.sin(t * 0.05) * w * 0.012;
      const cy = h * 0.47 + Math.cos(t * 0.041) * h * 0.014;
      const maxR = Math.max(w, h) * 0.56;

      for (const c of this.clouds) {
        const x = (((c.x + c.dx * t) % 1) + 1) % 1;
        const y = (((c.y + c.dy * t) % 1) + 1) % 1;
        const rr = c.r * Math.max(w, h) * (0.85 + 0.15 * Math.sin(t * 0.11 + c.ph));
        const g = ctx.createRadialGradient(x * w, y * h, 0, x * w, y * h, rr);
        g.addColorStop(0, c.c); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = (0.55 + 0.45 * Math.sin(t * 0.09 + c.ph)) * S;
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }

      ctx.globalCompositeOperation = th.comp;
      const ord = this.order, chaos = 1 - ord, lim = maxR * 0.34;
      for (const p of this.parts) {
        p.a += p.w * (1 + (p.wj - 1) * chaos) * o.speed * dt * 0.16;
        const r = p.t * maxR;
        let x = cx + Math.cos(p.a) * r;
        let y = cy + Math.sin(p.a) * r * 0.78;
        if (chaos > 0.002 || p.ox !== 0 || p.oy !== 0) {
          const amp = 300 * chaos;
          p.vx += (Math.random() - 0.5) * amp * dt;
          p.vy += (Math.random() - 0.5) * amp * dt * 0.85;
          const k = 3.4 * ord + 0.25;
          p.vx -= p.ox * k * dt * 2.4; p.vy -= p.oy * k * dt * 2.4;
          p.vx *= 0.985; p.vy *= 0.985;
          p.ox = Math.max(-lim, Math.min(lim, p.ox + p.vx * dt));
          p.oy = Math.max(-lim, Math.min(lim, p.oy + p.vy * dt));
          if (ord > 0.999 && Math.abs(p.ox) < 0.4 && Math.abs(p.oy) < 0.4) { p.ox = p.oy = p.vx = p.vy = 0; }
          x += p.ox; y += p.oy;
        }
        if (x < -40 || x > w + 40 || y < -40 || y > h + 40) continue;
        const tw = 0.55 + 0.45 * Math.sin(t * p.tw + p.ph);
        const alpha = Math.min(1, p.base * tw * S * (1 - p.t * 0.25));
        if (alpha <= 0.01) continue;
        ctx.globalAlpha = alpha;
        if (p.glyph && o.dataMode) {
          ctx.fillStyle = th.glyph + alpha.toFixed(2) + ')';
          ctx.globalAlpha = 1;
          ctx.font = (7 + p.size * 4).toFixed(1) + 'px Archivo, monospace';
          ctx.save(); ctx.translate(x, y); ctx.rotate(p.a + Math.PI / 2);
          ctx.fillText(p.glyph, 0, 0); ctx.restore();
          continue;
        }
        const s = (2.2 + p.size * 7) * (1 + tw * 0.25);
        ctx.drawImage(this.sprites[p.ci], x - s / 2, y - s / 2, s, s);
        if (p.spark && tw > 0.85) {
          ctx.globalAlpha = alpha * 0.7;
          ctx.strokeStyle = th.stars[p.ci];
          ctx.lineWidth = 0.7;
          const l = s * 1.9;
          ctx.beginPath();
          ctx.moveTo(x - l, y); ctx.lineTo(x + l, y);
          ctx.moveTo(x, y - l); ctx.lineTo(x, y + l);
          ctx.stroke();
        }
      }

      const fl = this.flash;
      const cr = Math.min(w, h) * (0.13 + 0.012 * Math.sin(t * 0.6)) * (1 + fl * 0.5) * (0.45 + 0.55 * ord);
      const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
      g2.addColorStop(0, th.core + Math.min(1, 0.85 * S * (0.4 + 0.6 * ord) + fl * 0.5).toFixed(2) + ')');
      g2.addColorStop(0.35, th.core + (0.22 * S * (0.4 + 0.6 * ord) + fl * 0.15).toFixed(2) + ')');
      g2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 1; ctx.fillStyle = g2;
      ctx.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);

      if (fl > 0.01) {
        const rr = (1 - fl) * maxR * 1.15;
        ctx.globalAlpha = fl * fl * 0.7;
        ctx.strokeStyle = th.ring;
        ctx.lineWidth = 1 + fl * 2.5;
        ctx.beginPath(); ctx.ellipse(cx, cy, rr, rr * 0.78, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (o.theme === 'dark') {
        if (o.transparent) {
          ctx.globalCompositeOperation = 'destination-out';
          const v = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.25, cx, cy, Math.max(w, h) * 0.72);
          v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.8)');
          ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
        } else {
          ctx.globalCompositeOperation = 'source-over';
          const v = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.2, cx, cy, Math.max(w, h) * 0.75);
          v.addColorStop(0, 'rgba(7,7,10,0)'); v.addColorStop(1, 'rgba(7,7,10,0.85)');
          ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
        }
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  }

  if (!window.customElements.get('jaren-vortex')) window.customElements.define('jaren-vortex', JarenVortex);
})();
