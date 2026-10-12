// Prepara le immagini della mappa del tabellone (cache in cards_final/print/_mappa/, rigenerabile):
//  - ritaglia le singole MEDAGLIE dai fogli "emblemi_<famiglia>.jpg" (una riga di medaglie su nero), rilevandole
//    sui pixel: <famiglia>_<n>.jpg, quadrate 280px, nell'ordine dei piani della famiglia (come in piani-data.json);
//  - riduce le NEBULOSE "nebulosa_<famiglia>.jpg" (2048x2048 su nero) a 1280px JPEG per tenere leggero il PDF.
// Uso: node prep-mappa.js
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const SRC = path.join(__dirname, '..', 'assets', 'ui', 'mappa');
const OUT = path.join(__dirname, '..', 'cards_final', 'print', '_mappa');
const FAMS = { elementare: 7, eterei: 5, armonia: 9, entropia: 9, demoniaco: 3, nonmorti: 3 };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args: ['--allow-file-access-from-files'] });
  const html = path.join(__dirname, '_mappa-prep.html');
  fs.writeFileSync(html, '<canvas id="c"></canvas><canvas id="o"></canvas>');
  const p = await b.newPage();
  await p.goto(pathToFileURL(html).href);
  for (const [fam, n] of Object.entries(FAMS)) {
    const url = pathToFileURL(path.join(SRC, `emblemi_${fam}.jpg`)).href;
    const res = await p.evaluate(async ([url, n, fam]) => {
      const img = new Image(); img.src = url; await img.decode();
      const c = document.getElementById('c'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
      const W = c.width, H = c.height, d = x.getImageData(0, 0, W, H).data;
      const lum = (px, py) => { const k = (py * W + px) * 4; return 0.3 * d[k] + 0.59 * d[k + 1] + 0.11 * d[k + 2]; };
      // la riga di medaglie e' l'unica zona luminosa: estensione per righe e colonne (soglia > 38), poi N medaglie a passo uniforme
      const rowCount = new Array(H).fill(0);
      for (let py = 0; py < H; py++) { let c2 = 0; for (let px = 0; px < W; px += 2) if (lum(px, py) > 38) c2++; rowCount[py] = c2; }
      let y0 = -1, y1 = -1;
      for (let py = 0; py < H; py++) if (rowCount[py] > 25) { if (y0 < 0) y0 = py; y1 = py; }
      const colCount = new Array(W).fill(0);
      for (let px = 0; px < W; px++) { let c2 = 0; for (let py = y0; py <= y1; py += 2) if (lum(px, py) > 38) c2++; colCount[px] = c2; }
      let xmin = -1, xmax = -1;
      for (let px = 0; px < W; px++) if (colCount[px] > 12) { if (xmin < 0) xmin = px; xmax = px; }
      const dm = y1 - y0 + 1, cy = (y0 + y1) / 2;
      const pitch = n > 1 ? (xmax - xmin + 1 - dm) / (n - 1) : 0;
      const real = Array.from({ length: n }, (_, i) => i);
      const out = [];
      const o = document.getElementById('o'); o.width = 280; o.height = 280;
      const oc = o.getContext('2d');
      for (const i of real) {
        const cx = xmin + dm / 2 + i * pitch;
        oc.clearRect(0, 0, 280, 280); oc.fillStyle = '#000'; oc.fillRect(0, 0, 280, 280);
        oc.drawImage(c, cx - dm / 2, cy - dm / 2, dm, dm, 0, 0, 280, 280);
        out.push({ cx, cy, dm, data: o.toDataURL('image/jpeg', 0.9) });
      }
      return { W, H, count: real.length, out };
    }, [url, n, fam]);
    console.log(fam, `attese ${n}, trovate ${res.count}`, res.out.map(m => `[${Math.round(m.cx)},${Math.round(m.cy)} d${Math.round(m.dm)}]`).join(' '));
    if (res.count !== n) console.log('  ATTENZIONE: il numero di medaglie non torna');
    res.out.forEach((m, i) => fs.writeFileSync(path.join(OUT, `${fam}_${i}.jpg`), Buffer.from(m.data.split(',')[1], 'base64')));
  }
  // nebulose ridotte
  for (const fam of Object.keys(FAMS)) {
    const url = pathToFileURL(path.join(SRC, `nebulosa_${fam}.jpg`)).href;
    const data = await p.evaluate(async url => {
      const img = new Image(); img.src = url; await img.decode();
      const o = document.getElementById('o'); o.width = 1280; o.height = 1280;
      o.getContext('2d').drawImage(img, 0, 0, 1280, 1280);
      return o.toDataURL('image/jpeg', 0.86);
    }, url);
    fs.writeFileSync(path.join(OUT, `nebulosa_${fam}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
  }
  await b.close(); fs.unlinkSync(html);
  console.log('Fatto: medaglie e nebulose ridotte in', OUT);
})();
