// Renderizza le 12 destinazioni del Piano Terreno in PNG pronti per la stampa,
// a partire da piano-terreno-data.json (nome, testo, se è un finale) e una
// cartella con le illustrazioni generate: <id>.png / .jpg / .webp
//
// Uso:
//   node render-piano-terreno.js <artDir> <outDir>
// Le 3 vere destinazioni finali (via_di_casa, antro_creatura, finale_c) ricevono
// un ribbon dorato "FINALE" per distinguerle a colpo d'occhio dalle altre 9
// destinazioni speciali (bonus/rischio, non finali).

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { pianoTerrenoPageHtml, CARD_W, CARD_H } = require('./template.js');

async function main() {
  const artDir = process.argv[2] || path.join(__dirname, '..', 'assets', 'cards');
  const outDir = process.argv[3] || path.join(__dirname, '..', 'cards_final', 'piano_terreno');

  const destinations = JSON.parse(fs.readFileSync(path.join(__dirname, 'piano-terreno-data.json'), 'utf8'));

  fs.mkdirSync(outDir, { recursive: true });

  const html = pianoTerrenoPageHtml(destinations, fs.existsSync(artDir) ? artDir : null);
  const htmlPath = path.join(__dirname, '_render-pt.html');
  fs.writeFileSync(htmlPath, html);

  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium',
  });
  const page = await browser.newPage({ viewport: { width: CARD_W + 200, height: CARD_H + 100 } });
  await page.goto('file://' + htmlPath);
  await page.waitForTimeout(3000);

  let missing = 0;
  for (const dest of destinations) {
    const el = await page.$(`#card-${dest.id}`);
    if (!el) { console.log('MANCA nel DOM:', dest.id); continue; }
    const outPath = path.join(outDir, dest.id + '.png');
    await el.screenshot({ path: outPath });
    const hasArt = fs.existsSync(artDir) && ['.png', '.jpg', '.jpeg', '.webp'].some(ext => fs.existsSync(path.join(artDir, dest.id + ext)));
    if (!hasArt) missing++;
    console.log((hasArt ? 'OK   ' : 'PLACEHOLDER '), dest.finale ? '★' : ' ', dest.id, '->', outPath);
  }

  await browser.close();
  console.log(`\nFatto: ${destinations.length} carte renderizzate in ${outDir}`);
  if (missing) console.log(`${missing} carte usano ancora il segnaposto (immagine non trovata in ${artDir}).`);
}

main().catch(err => { console.error(err); process.exit(1); });
