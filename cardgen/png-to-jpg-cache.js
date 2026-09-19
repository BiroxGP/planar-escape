// Converte i PNG delle carte (fronti in assets/cards, retri in cards_final/retro) in JPEG
// ad alta qualità, per alleggerire i PDF di stampa senza toccare i PNG usati dal gioco.
// Usa Chromium stesso (via un <canvas>) per la conversione, senza librerie extra.
//
// Uso: node png-to-jpg-cache.js <lista di id, separati da virgola> <srcDir> <outDir>

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const QUALITY = 0.88;

async function convertAll(pairs) {
  // pairs: [{id, srcDir, outDir}] — converte solo quelli il cui .jpg di destinazione
  // manca ancora o è più vecchio del PNG sorgente, per poter richiamare lo script più
  // volte senza riconvertire tutto da capo.
  const todo = pairs.filter(p => {
    const src = path.join(p.srcDir, p.id + '.png');
    const out = path.join(p.outDir, p.id + '.jpg');
    if (!fs.existsSync(src)) return false;
    if (!fs.existsSync(out)) return true;
    return fs.statSync(src).mtimeMs > fs.statSync(out).mtimeMs;
  });
  if (!todo.length) { console.log('Niente da convertire, cache già aggiornata.'); return; }

  // Chromium tratta OGNI file:// come un'origine a sé, anche rispetto a un altro file://
  // sullo stesso disco — leggere i pixel di un'immagine file:// dentro un canvas ospitato
  // da un'altra pagina file:// lo marca "tainted" (CORS) a meno di questo flag, pensato
  // apposta per questo scenario (pagina HTML locale che manipola immagini locali).
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium',
    args: ['--allow-file-access-from-files'],
  });
  const page = await browser.newPage();
  const canvasHtmlPath = path.join(__dirname, '_canvas-convert.html');
  fs.writeFileSync(canvasHtmlPath, '<canvas id="c"></canvas>');
  await page.goto(pathToFileURL(canvasHtmlPath).href);

  for (const p of todo) {
    const src = path.join(p.srcDir, p.id + '.png');
    const out = path.join(p.outDir, p.id + '.jpg');
    fs.mkdirSync(p.outDir, { recursive: true });
    const fileUrl = pathToFileURL(src).href;
    try {
      const dataUrl = await page.evaluate(async ({ fileUrl, quality }) => {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error('immagine non caricata: ' + fileUrl));
          img.src = fileUrl;
        });
        const canvas = document.getElementById('c');
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height); // sfondo nero dietro eventuali angoli arrotondati trasparenti
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL('image/jpeg', quality);
      }, { fileUrl, quality: QUALITY });
      const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
      fs.writeFileSync(out, Buffer.from(base64, 'base64'));
    } catch (e) {
      console.error(`  ERRORE convertendo ${p.id} (${src}):`, e.message);
    }
  }

  await browser.close();
  fs.unlinkSync(canvasHtmlPath);
  console.log(`Convertiti ${todo.length} PNG -> JPEG (qualità ${QUALITY}).`);
}

module.exports = { convertAll };
