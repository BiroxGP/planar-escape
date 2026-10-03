// Scatola provvisoria: titolo "Planar Escape" sul fronte (in alto) e sulla costola (centrato
// nella fascia scura tra i fregi dorati). La stessa immagine costola vale per sx e dx.
// Le immagini sorgente sono già alla dimensione di stampa esatta (300 dpi): l'output ha gli
// stessi pixel e la stessa densità, si sovrappone solo il testo.
//   fronte  3385x1890 px = 286,6 x 160,0 mm
//   costola 1772x585  px = 150,0 x 49,5 mm
//
// Il testo resta sempre dentro un margine di sicurezza di 5 mm dal bordo (taglio/piega).
// Sulla costola il font si autoridimensiona per stare nella fascia scura centrale (misurata
// campionando i pixel) e non toccare mai i fregi.
//
// Uso: node render-scatola.js

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const RAW = path.join(__dirname, '..', 'assets', 'cards_raw');
const OUT_DIR = path.join(__dirname, '..', 'cards_final', 'scatola');
const PX_PER_MM = 300 / 25.4;
const SAFE = Math.round(5 * PX_PER_MM);
const TITLE = 'Planar Escape';

const PIECES = [
  { id: 'fronte', src: 'scatola_fronte.jpg', w: 3385, h: 1890 },
  { id: 'costola', src: 'scatola_costola.jpg', w: 1772, h: 585 },
];

function pageHtml(p) {
  // data URL (non file://) così il canvas di measureBand non risulta "tainted"
  const bg = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(RAW, p.src)).toString('base64');
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@700;900&display=swap">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${p.w}px;height:${p.h}px;overflow:hidden;background:#000}
  #bg{position:absolute;inset:0;width:${p.w}px;height:${p.h}px}
  .title{
    position:absolute; left:50%; transform:translateX(-50%); white-space:nowrap;
    font-family:'Cinzel Decorative','Cinzel',serif; font-weight:900; line-height:1;
    letter-spacing:.04em; text-align:center;
    background:linear-gradient(180deg,#fff6d8 0%,#f3d58a 38%,#c99a3e 62%,#f0d48c 100%);
    -webkit-background-clip:text; background-clip:text; color:transparent;
  }
  /* livello sotto il testo dorato: contorno scuro + bagliore, senza sporcare il gradiente */
  .shadow{ position:absolute; left:50%; transform:translateX(-50%); white-space:nowrap;
    font-family:'Cinzel Decorative','Cinzel',serif; font-weight:900; line-height:1;
    letter-spacing:.04em; color:#241433; }
</style></head><body>
<img id="bg" src="${bg}">
<div class="shadow" id="sh">${TITLE}</div>
<div class="title" id="t">${TITLE}</div>
</body></html>`;
}

// trova la fascia scura centrale della costola: righe/colonne dove la luminanza media è minima
async function measureBand(page, p) {
  return page.evaluate(async ({ w, h }) => {
    const img = document.getElementById('bg'); await img.decode();
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h); // naturalWidth è ridotto dai 300 dpi EXIF, forzo i pixel veri
    const d = g.getImageData(0, 0, w, h).data;
    const lum = (x, y) => { const i = (y * w + x) * 4; return 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; };
    // colonna centrale: dove inizia/finisce la fascia scura in verticale
    const cx = Math.round(w / 2);
    const col = []; for (let y = 0; y < h; y++) { let s = 0; for (let x = cx - 40; x < cx + 40; x++) s += lum(x, y); col.push(s / 80); }
    const inner = col[Math.round(h / 2)];
    const outer = col[Math.round(h * 0.2)];
    const thr = (inner + outer) / 2;
    let top = Math.round(h / 2), bot = top;
    while (top > 0 && col[top - 1] < thr) top--;
    while (bot < h - 1 && col[bot + 1] < thr) bot++;
    // fregi: lungo la riga centrale, primo pixel chiaro (oro) da sinistra/destra del centro
    let left = cx, right = cx; const cy = Math.round(h / 2);
    const bright = (x) => { let m = 0; for (let y = top; y <= bot; y += 2) m = Math.max(m, lum(x, y)); return m; };
    while (left > 0 && bright(left - 1) < 90) left--;
    while (right < w - 1 && bright(right + 1) < 90) right++;
    return { top, bot, left, right, inner: Math.round(inner), outer: Math.round(outer) };
  }, p);
}

function setJfifDpi(buf, dpi) {
  // APP0 JFIF subito dopo SOI: unità=1 (dpi), densità X/Y
  if (buf[2] === 0xFF && buf[3] === 0xE0 && buf.toString('ascii', 6, 10) === 'JFIF') {
    buf[13] = 1; buf.writeUInt16BE(dpi, 14); buf.writeUInt16BE(dpi, 16);
  }
  return buf;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  for (const p of PIECES) {
    const page = await browser.newPage({ viewport: { width: p.w, height: p.h }, deviceScaleFactor: 1 });
    const tmp = path.join(OUT_DIR, `_${p.id}.html`);
    fs.writeFileSync(tmp, pageHtml(p));
    await page.goto(pathToFileURL(tmp).href);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => document.getElementById('bg').complete);

    let layout;
    if (p.id === 'fronte') {
      // in alto, centrato sull'arco del portale; larghezza ~72% del fronte
      layout = { maxW: Math.round(p.w * 0.72), maxH: 330, top: SAFE + 70, stroke: 22, glow: 60 };
    } else {
      const band = await measureBand(page, p);
      console.log('costola, fascia scura misurata:', band);
      const pad = 40; // aria tra testo e fregi/bordi fascia
      layout = {
        maxW: band.right - band.left - 2 * pad,
        maxH: band.bot - band.top - 2 * pad,
        centerY: (band.top + band.bot) / 2, stroke: 8, glow: 24,
      };
    }

    const box = await page.evaluate((L) => {
      const t = document.getElementById('t'), sh = document.getElementById('sh');
      let fs = 400;
      const apply = () => { for (const el of [t, sh]) el.style.fontSize = fs + 'px'; };
      apply();
      while ((t.offsetWidth > L.maxW || t.offsetHeight > L.maxH) && fs > 10) { fs -= 1; apply(); }
      const top = L.top != null ? L.top : Math.round(L.centerY - t.offsetHeight / 2);
      for (const el of [t, sh]) el.style.top = top + 'px';
      sh.style.webkitTextStroke = `${L.stroke}px #241433`;
      sh.style.textShadow = `0 0 ${L.glow}px rgba(20,8,30,.85), 0 ${L.stroke / 2}px ${L.glow / 2}px rgba(0,0,0,.7)`;
      const r = t.getBoundingClientRect();
      return { fontSize: fs, left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom) };
    }, layout);
    console.log(p.id, 'titolo:', box, `margine sicurezza ${SAFE}px`);
    if (box.left < SAFE || box.right > p.w - SAFE || box.top < SAFE || box.bottom > p.h - SAFE) {
      console.warn('  ATTENZIONE: titolo fuori dal margine di sicurezza');
    }

    const jpg = await page.screenshot({ type: 'jpeg', quality: 95 });
    fs.writeFileSync(path.join(OUT_DIR, `scatola_${p.id}.jpg`), setJfifDpi(Buffer.from(jpg), 300));
    fs.unlinkSync(tmp);
    await page.close();
  }
  await browser.close();
})();
