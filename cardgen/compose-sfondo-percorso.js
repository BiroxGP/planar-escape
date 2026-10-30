// Ricompone lo sfondo del tabellone allargato (616 x 580mm) a partire dall'immagine generata dall'utente
// (assets/ui/tabellone_percorso_v1.jpg, 2112x2016): la parte sinistra resta (leggermente allargata), la fascia di destra
// viene ricostruita con le proporzioni giuste per 5 carte Poker dritte per colonna (archi e porta rimpiccioliti, corpo delle
// colonne allungato, nicchie disegnate esattamente sotto le 15 caselle).
// Uso: node compose-sfondo-percorso.js [anteprima]   ->  assets/ui/tabellone_percorso_v2.jpg (+ cards_final/altro/percorso_sfondo_anteprima.png)
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const SRC = path.join(__dirname, '..', 'assets', 'ui', 'tabellone_percorso_v1.jpg');
const OUT = path.join(__dirname, '..', 'assets', 'ui', 'tabellone_percorso_v2.jpg');
const VERT = path.join(__dirname, '..', 'assets', 'ui', 'fascia_percorso_v1.jpg');   // fascia verticale rigenerata dall'utente (1248x3392), senza filo di luce
const PREV = path.join(__dirname, '..', 'cards_final', 'altro', 'percorso_sfondo_anteprima.png');
const CARDS = ['el_elementale', 'el_vena', 'ar_custode', 'et_incubo', 'ge_viandante', 'en_caos', 'nm_spettro'].map(id => pathToFileURL(path.join(__dirname, '..', 'assets', 'cards', id + '.png')).href);

const PX = 3.4286;                 // px per mm (3 fogli A4 con 14mm di sovrapposizione = 602 x 580mm: 2064 x 1990 px)
const W = 2064, H = 1990;
const GEO = {
  W, H, BORDER: 75, BOT: 1919,
  SRC_W: 2112, SRC_H: 2016, SRC_DIV: 1255, SRC_RIGHT: 2040, SRC_BOTB: 1945,
  LEFT_END: 1299,                  // x (dest) dove finisce il tabellone originale e inizia la fascia del percorso
  XK: 0.883,                       // scala orizzontale della fascia di destra
  ARCH_SRC: { cx: [1385, 1648, 1905], y0: 98, y1: 360, hw: 140 }, ARCH_S: 0.6, ARCH_DY: 82,
  BODY_SRC: [352, 1600], BODY_DEST_TOP: 233, RING_SRC_Y: 1500,
  SLOT: { x: [413.5, 480, 546.5], w: 63.5, h: 88, y0: 72, pitch: 90 },       // mm
  DOOR: { sx0: 1500, sx1: 1790, sy0: 1640, sy1: 1950, s: 0.36, dy: 1800 },
};

const PAGE = `<!doctype html><html><body style="margin:0;background:#000"><canvas id="c"></canvas></body></html>`;

(async () => {
  const preview = process.argv.includes('anteprima');
  const noThread = process.argv.includes('senzafilo');
  const useVert = process.argv.includes('fascia');
  if (useVert) { /* niente filo */ }
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const tmp = path.join(__dirname, '_compose.html'); fs.writeFileSync(tmp, PAGE);
  await page.goto(pathToFileURL(tmp).href);
  const res = await page.evaluate(async ([src, G, cards, preview, PX, noThread, vsrc]) => {
    const load = u => new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = u; });
    let img = await load(src);
    if (noThread) {   // toglie il filo di polvere di stelle dalla fascia di destra: i puntini luminosi azzurrini piccoli diventano il colore sfocato attorno
      const cl = document.createElement('canvas'); cl.width = img.naturalWidth; cl.height = img.naturalHeight; const cx = cl.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
      const bl = document.createElement('canvas'); bl.width = cl.width; bl.height = cl.height; const bx2 = bl.getContext('2d', { willReadFrequently: true }); bx2.filter = 'blur(9px)'; bx2.drawImage(img, 0, 0);
      const X0 = G.SRC_DIV + 3, X1 = G.SRC_RIGHT - 3, Y0 = G.BORDER, Y1 = G.SRC_BOTB - 3;
      for (let pass = 0; pass < 2; pass++) {
        const d = cx.getImageData(X0, Y0, X1 - X0, Y1 - Y0), e = bx2.getImageData(X0, Y0, X1 - X0, Y1 - Y0);
        for (let i = 0; i < d.data.length; i += 4) {
          const r = d.data[i], g = d.data[i + 1], b = d.data[i + 2], lum = (r * .3 + g * .59 + b * .11), lb = (e.data[i] * .3 + e.data[i + 1] * .59 + e.data[i + 2] * .11);
          if (b >= r - 6 && lum - lb > 22 && lum > 70) { d.data[i] = e.data[i]; d.data[i + 1] = e.data[i + 1]; d.data[i + 2] = e.data[i + 2]; }
        }
        cx.putImageData(d, X0, Y0);
      }
      img = cl;
    }
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    // ---- 0) copia di lavoro della sorgente, senza la porta (clone dei mattoni della colonna 1, ruotati di tinta verso il viola) ----
    const base = mk(G.SRC_W, G.SRC_H), bx = base.getContext('2d'); bx.drawImage(img, 0, 0);
    const feather = (ctx, source, sx, sy, sw, sh, dx, dy, dw, dh, f, filter) => {
      const t = mk(Math.round(dw), Math.round(dh)), tx = t.getContext('2d');
      if (filter) tx.filter = filter;
      tx.drawImage(source, sx, sy, sw, sh, 0, 0, dw, dh); tx.filter = 'none';
      tx.globalCompositeOperation = 'destination-in';
      const m = mk(Math.round(dw), Math.round(dh)), mx = m.getContext('2d');
      mx.fillStyle = '#fff'; mx.fillRect(f, f, dw - 2 * f, dh - 2 * f); mx.filter = 'blur(' + f / 2 + 'px)'; mx.drawImage(m, 0, 0);
      // maschera sfumata: rettangolo bianco sfocato
      const m2 = mk(Math.round(dw), Math.round(dh)), m2x = m2.getContext('2d');
      m2x.fillStyle = '#fff'; m2x.filter = 'blur(' + f * 0.6 + 'px)'; m2x.fillRect(f, f, dw - 2 * f, dh - 2 * f);
      tx.drawImage(m2, 0, 0);
      ctx.drawImage(t, dx, dy);
    };
    // porta: la colonna 2 prende i mattoni della colonna 1 (x +258)
    feather(bx, base, 1290, 1620, 215, 330, 1548, 1620, 215, 330, 22, 'hue-rotate(38deg) saturate(1.05)');
    // ---- 1) tela finale ----
    const cv = document.getElementById('c'); cv.width = G.W; cv.height = G.H;
    const x = cv.getContext('2d'); x.imageSmoothingQuality = 'high';
    x.fillStyle = '#0b0f1e'; x.fillRect(0, 0, G.W, G.H);
    const B = G.BORDER, BOT = G.BOT;
    // parte sinistra (interno)
    x.drawImage(base, B, B, G.SRC_DIV - B, G.SRC_BOTB - B, B, B, G.LEFT_END - B, BOT - B);
    // fascia di destra: x scala XK
    const rx = sx => G.LEFT_END + (sx - G.SRC_DIV) * G.XK;
    const RIGHT_DEST = G.W - (G.SRC_W - G.SRC_RIGHT);
    const rw = G.SRC_RIGHT - G.SRC_DIV;
    const [b0, b1] = G.BODY_SRC;
    const slotTop = Math.round(G.SLOT.y0 * PX), pitchPx = G.SLOT.pitch * PX, slotH = G.SLOT.h * PX;
    const ringDest = slotTop + 4 * pitchPx + slotH / 2;
    const k = (ringDest - G.BODY_DEST_TOP) / (G.RING_SRC_Y - b0);
    const bodyDestBot = G.BODY_DEST_TOP + (b1 - b0) * k;
    if (vsrc) {
      const v = await load(vsrc);
      const sx = (rw * G.XK) / v.naturalWidth;               // scala orizzontale della fascia
      const dx = G.LEFT_END, dw = rw * G.XK;
      const topBand = 250;                                    // fascia alta (sotto gli archi) fino a dove parte il corpo
      // corpo e fasce: la lastra (y 520..700) riempie la fascia alta, il corpo (520..2950) si allunga fino a poco sopra la porta
      x.drawImage(v, 0, 560, v.naturalWidth, 160, dx, B, dw, topBand - B + 2);
      x.drawImage(v, 0, 560, v.naturalWidth, 2400, dx, topBand, dw, 1800 - topBand);
      x.drawImage(v, 0, 3000, v.naturalWidth, 160, dx, 1795, dw, BOT - 1795);
      // archi (da y 40..520 originali) rimpiccioliti per stare nei 36x44mm sopra le caselle; centri colonna dell'immagine: 221, 629, 1045
      [221, 629, 1045].forEach(cx0 => {
        const aw = 330, ah = 485, ds = 0.35;
        feather(x, v, cx0 - aw / 2, 36, aw, ah, dx + cx0 * sx - aw * ds / 2, B + 6, aw * ds, ah * ds, 14);
      });
      // porta (centro colonna 2) rimpicciolita in basso
      feather(x, v, 629 - 150, 3150, 300, 242, dx + 629 * sx - 150 * 0.5, BOT - 242 * 0.5 - 4, 300 * 0.5, 242 * 0.5, 12);
      const sg = x.createLinearGradient(0, BOT - 22, 0, BOT); sg.addColorStop(0, 'rgba(10,12,28,0)'); sg.addColorStop(1, 'rgba(10,12,28,.9)'); x.fillStyle = sg; x.fillRect(dx, BOT - 22, dw, 22);
    } else {
    // fascia alta (lastra): src 352..445 allungata
    x.drawImage(base, G.SRC_DIV, 352, rw, 93, G.LEFT_END, B, rw * G.XK, G.BODY_DEST_TOP - B + 2);
    // corpo
    x.drawImage(base, G.SRC_DIV, b0, rw, b1 - b0, G.LEFT_END, G.BODY_DEST_TOP, rw * G.XK, bodyDestBot - G.BODY_DEST_TOP);
    // zona porta (mattoni, senza porta): src 1600..1945 schiacciata
    x.drawImage(base, G.SRC_DIV, b1, rw, G.SRC_BOTB - b1, G.LEFT_END, bodyDestBot, rw * G.XK, BOT - bodyDestBot);
    }
    // ---- 2) archi rimpiccioliti ----
    const A = G.ARCH_SRC;
    if (!vsrc) A.cx.forEach(cx => {
      const dw = 2 * A.hw * G.ARCH_S, dh = (A.y1 - A.y0) * G.ARCH_S;
      feather(x, img, cx - A.hw, A.y0, 2 * A.hw, A.y1 - A.y0, rx(cx) - dw / 2, G.ARCH_DY, dw, dh, 16);
    });
    // ---- 3) porta rimpicciolita ----
    const D = G.DOOR, dw2 = (D.sx1 - D.sx0) * D.s, dh2 = (D.sy1 - D.sy0) * D.s;
    if (!vsrc) feather(x, img, D.sx0, D.sy0, D.sx1 - D.sx0, D.sy1 - D.sy0, rx(1648) - dw2 / 2, D.dy, dw2, dh2, 14);
    // ---- 4) nicchie delle 15 caselle ----
    const slots = [];
    for (let c = 0; c < 3; c++) for (let r = 0; r < 5; r++) {
      const cxm = G.SLOT.x[c], sxp = (cxm - G.SLOT.w / 2) * PX, syp = slotTop + r * pitchPx;
      slots.push([sxp, syp, G.SLOT.w * PX, slotH, c * 5 + r + 1]);
    }
    // filo di luce (polvere di stelle) negli spazi fra le colonne
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    if (!noThread) [(G.SLOT.x[0] + G.SLOT.x[1]) / 2, (G.SLOT.x[1] + G.SLOT.x[2]) / 2].forEach((mmx, li) => {
      const x0p = mmx * PX;
      for (let yy = slotTop - 12; yy < slotTop + 4 * pitchPx + slotH + 14; yy += 3.4) {
        const off = Math.sin(yy / 140 + li * 2) * 2.2 + (rnd() - .5) * 3;
        const r = .5 + rnd() * 1.1;
        const gl = x.createRadialGradient(x0p + off, yy, 0, x0p + off, yy, r * 4);
        gl.addColorStop(0, 'rgba(190,225,255,.8)'); gl.addColorStop(.3, 'rgba(130,190,255,.22)'); gl.addColorStop(1, 'rgba(100,160,255,0)');
        x.fillStyle = gl; x.beginPath(); x.arc(x0p + off, yy, r * 4, 0, 7); x.fill();
      }
    });
    slots.forEach(([sx, sy, sw, sh, n]) => {
      const rad = 16;
      x.save();
      x.beginPath(); x.roundRect(sx, sy, sw, sh, rad);
      const tint = [[8,18,40],[19,15,46],[32,24,20]][Math.floor((n - 1) / 5)];
      x.fillStyle = 'rgba(' + tint[0] + ',' + tint[1] + ',' + tint[2] + (vsrc ? ',.95)' : ',.84)'); x.fill();
      const g = x.createLinearGradient(0, sy, 0, sy + sh); g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(.18, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(255,255,255,.05)');
      x.fillStyle = g; x.fill();
      x.lineWidth = 3; x.strokeStyle = 'rgba(231,201,136,.42)'; x.stroke();
      x.beginPath(); x.roundRect(sx + 7, sy + 7, sw - 14, sh - 14, rad - 5); x.lineWidth = 1.4; x.strokeStyle = 'rgba(231,201,136,.16)'; x.stroke();
      x.restore();
      if (n % 5 === 0) {      // anello-portale inciso sulle caselle 5, 10, 15
        const cx2 = sx + sw / 2, cy2 = sy + sh / 2;
        x.save(); x.strokeStyle = 'rgba(231,201,136,.30)'; x.lineWidth = 5;
        x.beginPath(); x.arc(cx2, cy2, 62, 0, 7); x.stroke();
        x.lineWidth = 1.6; x.beginPath(); x.arc(cx2, cy2, 50, 0, 7); x.stroke();
        for (let t = 0; t < 12; t++) { const a = t * Math.PI / 6; x.beginPath(); x.moveTo(cx2 + Math.cos(a) * 66, cy2 + Math.sin(a) * 66); x.lineTo(cx2 + Math.cos(a) * 76, cy2 + Math.sin(a) * 76); x.lineWidth = 2.4; x.stroke(); }
        x.restore();
      }
    });
    // ---- 5) cornice: bande native sopra, sotto, a sinistra e a destra ----
    x.drawImage(img, 0, 0, G.SRC_W, B, 0, 0, G.W, B);   // (la cornice alta e bassa si comprime del 2%)
    x.drawImage(img, 0, G.SRC_BOTB, G.SRC_W, G.SRC_H - G.SRC_BOTB, 0, BOT, G.W, G.H - BOT);
    x.drawImage(img, 0, B, B, G.SRC_BOTB - B, 0, B, B, BOT - B);
    x.drawImage(img, G.SRC_RIGHT, B, G.SRC_W - G.SRC_RIGHT, G.SRC_BOTB - B, RIGHT_DEST, B, G.SRC_W - G.SRC_RIGHT, BOT - B);
    // separatore dorato sottile fra tabellone e percorso
    x.fillStyle = 'rgba(214,176,106,.55)'; x.fillRect(G.LEFT_END - 3, B, 2.5, BOT - B);
    const finalUrl = cv.toDataURL('image/jpeg', 0.93).split(',')[1];
    let prevUrl = null;
    if (preview) {
      const pv = mk(G.W, G.H), px = pv.getContext('2d'); px.drawImage(cv, 0, 0);
      const ims = await Promise.all(cards.map(load));
      slots.forEach(([sx, sy, sw, sh, n]) => {
        if (n <= ims.length) px.drawImage(ims[n - 1], sx, sy, sw, sh);
        px.fillStyle = '#0c1024'; px.beginPath(); px.arc(sx + 22, sy + 22, 16, 0, 7); px.fill(); px.strokeStyle = '#e7c988'; px.lineWidth = 2; px.stroke();
        px.fillStyle = '#e7c988'; px.font = '700 18px sans-serif'; px.textAlign = 'center'; px.fillText(n, sx + 22, sy + 28);
      });
      prevUrl = pv.toDataURL('image/png').split(',')[1];
    }
    return { finalUrl, prevUrl };
  }, [pathToFileURL(SRC).href, GEO, CARDS, preview, PX, noThread, useVert ? pathToFileURL(VERT).href : null]);
  fs.writeFileSync(useVert ? OUT.replace('_v2', '_v3') : (noThread ? OUT.replace('_v2', '_v2_senzafilo') : OUT), Buffer.from(res.finalUrl, 'base64'));
  if (res.prevUrl) { fs.mkdirSync(path.dirname(PREV), { recursive: true }); fs.writeFileSync(PREV, Buffer.from(res.prevUrl, 'base64')); }
  await browser.close(); fs.unlinkSync(tmp);
  console.log('Fatto: ' + OUT);
})();
