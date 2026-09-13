// Renderizza i 36 Piani in PNG pronti per la stampa, a partire da:
//  - piani-data.json  (dati carta: nome, famiglia, check, recupero, testo)
//  - flavors.json     (una riga di atmosfera per carta, opzionale)
//  - una cartella con le illustrazioni generate: <id>.png / .jpg / .webp
//
// Uso:
//   node render.js <artDir> <outDir>
// Se una carta non ha ancora l'immagine, viene mostrato un segnaposto colorato
// (stessa convenzione dell'app web) invece di bloccare il render.
//
// Nota: usa i font Google (Cinzel / Source Serif 4 / JetBrains Mono) via link
// online. Se lo esegui in un ambiente senza accesso a internet, il browser userà
// automaticamente i font di fallback indicati nel CSS.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { pageHtml, CARD_W, CARD_H } = require('./template.js');

async function main() {
  // default: legge da assets/cards nella root del progetto (la stessa cartella
  // che usa già l'app web) e scrive le carte finite in cards_final/piani/
  const artDir = process.argv[2] || path.join(__dirname, '..', 'assets', 'cards');
  const outDir = process.argv[3] || path.join(__dirname, '..', 'cards_final', 'piani');

  const planes = JSON.parse(fs.readFileSync(path.join(__dirname, 'piani-data.json'), 'utf8'));
  const flavors = JSON.parse(fs.readFileSync(path.join(__dirname, 'flavors.json'), 'utf8'));

  fs.mkdirSync(outDir, { recursive: true });

  const html = pageHtml(planes, flavors, fs.existsSync(artDir) ? artDir : null);
  const htmlPath = path.join(__dirname, '_render.html');
  fs.writeFileSync(htmlPath, html);

  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium',
  });
  const page = await browser.newPage({ viewport: { width: CARD_W + 100, height: CARD_H + 100 } });
  await page.goto('file://' + htmlPath);
  // dai tempo a font e alle 36 illustrazioni (2-3MB l'una, tutte sulla stessa
  // pagina) di caricare e decodificare prima dello screenshot.
  await page.waitForTimeout(3000);

  let missing = 0;
  for (const plane of planes) {
    const el = await page.$(`#card-${plane.id}`);
    if (!el) { console.log('MANCA nel DOM:', plane.id); continue; }
    const outPath = path.join(outDir, plane.id + '.png');
    await el.screenshot({ path: outPath });
    const hasArt = fs.existsSync(artDir) && ['.png', '.jpg', '.jpeg', '.webp'].some(ext => fs.existsSync(path.join(artDir, plane.id + ext)));
    if (!hasArt) missing++;
    console.log((hasArt ? 'OK   ' : 'PLACEHOLDER '), plane.id, '->', outPath);
  }

  await browser.close();
  console.log(`\nFatto: ${planes.length} carte renderizzate in ${outDir}`);
  if (missing) console.log(`${missing} carte usano ancora il segnaposto (immagine non trovata in ${artDir}).`);
}

main().catch(err => { console.error(err); process.exit(1); });
