// Prepara le immagini LEGGERE della mappa stellare per l'app web (assets/ui/mappa_web/):
//  - le 36 medaglie dalle cache di prep-mappa.js (cards_final/print/_mappa/<famiglia>_<n>.jpg) a 160px;
//  - le 6 nebulose a 720px JPEG (sul sito si fondono col nero in modo "screen");
//  - la pedina Piano (cards_final/pedine/pedina_piano.png) a 220px PNG con trasparenza.
// Prima: node prep-mappa.js && node render-pedine.js piano
// Uso:   node prep-mappa-web.js
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const MAPPA = path.join(__dirname, '..', 'cards_final', 'print', '_mappa');
const PEDINA = path.join(__dirname, '..', 'cards_final', 'pedine', 'pedina_piano.png');
const OUT = path.join(__dirname, '..', 'assets', 'ui', 'mappa_web');
const FAMS = { elementare: 7, eterei: 5, armonia: 9, entropia: 9, demoniaco: 3, nonmorti: 3 };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args: ['--allow-file-access-from-files'] });
  const html = path.join(__dirname, '_mappa-web.html');
  fs.writeFileSync(html, '<canvas id="c"></canvas>');
  const p = await b.newPage();
  await p.goto(pathToFileURL(html).href);
  async function shrink(src, dst, size, type, q) {
    const url = pathToFileURL(src).href;
    const b64 = await p.evaluate(async ([url, size, type, q]) => {
      const img = new Image(); img.src = url; await img.decode();
      const c = document.getElementById('c'); c.width = size; c.height = size;
      const x = c.getContext('2d'); x.clearRect(0, 0, size, size);
      x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, size, size);
      return c.toDataURL(type, q).split(',')[1];
    }, [url, size, type, q]);
    fs.writeFileSync(dst, Buffer.from(b64, 'base64'));
  }
  for (const [fam, n] of Object.entries(FAMS)) {
    for (let i = 0; i < n; i++) await shrink(path.join(MAPPA, fam + '_' + i + '.jpg'), path.join(OUT, fam + '_' + i + '.jpg'), 160, 'image/jpeg', 0.85);
    await shrink(path.join(MAPPA, 'nebulosa_' + fam + '.jpg'), path.join(OUT, 'nebulosa_' + fam + '.jpg'), 720, 'image/jpeg', 0.8);
  }
  await shrink(PEDINA, path.join(OUT, 'pedina_piano.png'), 220, 'image/png');
  await b.close();
  fs.unlinkSync(html);
  const files = fs.readdirSync(OUT);
  const bytes = files.reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
  console.log('Fatto: ' + files.length + ' file in assets/ui/mappa_web/ (' + (bytes / 1024).toFixed(0) + ' KB)');
})();
