// Renderizza le 13 classi in PNG pronti per la stampa, a partire da
// classes-data.json (statistiche iniziali, armi, resistenze, descrizione) e una
// cartella con le illustrazioni generate: <id>.png / .jpg / .webp
//
// Uso:
//   node render-classes.js <artDir> <outDir>

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { classPageHtml, PORTRAIT_CARD_W, PORTRAIT_CARD_H } = require('./template.js');

async function main() {
  const artDir = process.argv[2] || path.join(__dirname, '..', 'assets', 'cards');
  const outDir = process.argv[3] || path.join(__dirname, '..', 'cards_final', 'classi');

  const classes = JSON.parse(fs.readFileSync(path.join(__dirname, 'classes-data.json'), 'utf8'));

  fs.mkdirSync(outDir, { recursive: true });

  const html = classPageHtml(classes, fs.existsSync(artDir) ? artDir : null);
  const htmlPath = path.join(__dirname, '_render-classi.html');
  fs.writeFileSync(htmlPath, html);

  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium',
  });
  const page = await browser.newPage({ viewport: { width: PORTRAIT_CARD_W + 200, height: PORTRAIT_CARD_H + 100 } });
  await page.goto('file://' + htmlPath);
  await page.waitForTimeout(3000);

  let missing = 0;
  for (const cls of classes) {
    const el = await page.$(`#card-${cls.id}`);
    if (!el) { console.log('MANCA nel DOM:', cls.id); continue; }
    const outPath = path.join(outDir, cls.id + '.png');
    await el.screenshot({ path: outPath });
    const hasArt = fs.existsSync(artDir) && ['.png', '.jpg', '.jpeg', '.webp'].some(ext => fs.existsSync(path.join(artDir, cls.id + ext)));
    if (!hasArt) missing++;
    console.log((hasArt ? 'OK   ' : 'PLACEHOLDER '), cls.id, '->', outPath);
  }

  await browser.close();
  console.log(`\nFatto: ${classes.length} carte renderizzate in ${outDir}`);
  if (missing) console.log(`${missing} carte usano ancora il segnaposto (immagine non trovata in ${artDir}).`);
}

main().catch(err => { console.error(err); process.exit(1); });
