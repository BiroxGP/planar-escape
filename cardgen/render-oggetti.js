// Renderizza le carte Oggetto (60, su 7 categorie: arma, armatura, anello, pozione,
// protezione, oneshot, particolare) in PNG pronti per la stampa, a partire da
// oggetti-data.json e una cartella con le illustrazioni generate: <id>.png/.jpg/.webp,
// più i sigilli di categoria condivisi icon-arma/icon-armatura/ecc. (badge sottile in alto
// a destra, meno invasivo di quello degli spell).
//
// Uso:
//   node render-oggetti.js <artDir> <outDir> [id1,id2,...]
// Il terzo argomento, opzionale, filtra a una lista di id — comodo per aggiornare solo gli
// oggetti che hanno appena ricevuto un'illustrazione (es. solo quelli di categoria "arma"),
// senza rischiare segnaposto sugli altri.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { itemPageHtml, PORTRAIT_CARD_W, PORTRAIT_CARD_H } = require('./template.js');

async function main() {
  const artDir = process.argv[2] || path.join(__dirname, '..', 'assets', 'cards');
  const outDir = process.argv[3] || path.join(__dirname, '..', 'cards_final', 'oggetti');
  const idFilter = process.argv[4] ? process.argv[4].split(',') : null;

  let items = JSON.parse(fs.readFileSync(path.join(__dirname, 'oggetti-data.json'), 'utf8'));
  if (idFilter) items = items.filter(it => idFilter.includes(it.id));
  if (items.length === 0) { console.error('Nessun oggetto trovato per il filtro "' + (idFilter||[]).join(',') + '".'); process.exit(1); }

  fs.mkdirSync(outDir, { recursive: true });

  const html = itemPageHtml(items, fs.existsSync(artDir) ? artDir : null);
  const htmlPath = path.join(__dirname, '_render-oggetti.html');
  fs.writeFileSync(htmlPath, html);

  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium',
  });
  const page = await browser.newPage({ viewport: { width: PORTRAIT_CARD_W + 200, height: PORTRAIT_CARD_H + 100 } });
  await page.goto('file://' + htmlPath);
  await page.waitForTimeout(3000);

  let missing = 0;
  for (const it of items) {
    const el = await page.$(`#card-${it.id}`);
    if (!el) { console.log('MANCA nel DOM:', it.id); continue; }
    const outPath = path.join(outDir, it.id + '.png');
    await el.screenshot({ path: outPath });
    const hasArt = fs.existsSync(artDir) && ['.png', '.jpg', '.jpeg', '.webp'].some(ext => fs.existsSync(path.join(artDir, it.id + ext)));
    if (!hasArt) missing++;
    console.log((hasArt ? 'OK   ' : 'PLACEHOLDER '), it.cat, it.id, '->', outPath);
  }

  await browser.close();
  console.log(`\nFatto: ${items.length} carte renderizzate in ${outDir}`);
  if (missing) console.log(`${missing} carte usano ancora il segnaposto (immagine non trovata in ${artDir}).`);
}

main().catch(err => { console.error(err); process.exit(1); });
