// Renderizza le carte Incontro (tutti i sotto-mazzi: elementare, demoni, nonmorti,
// eterei, armonia, entropia, generico) in PNG pronti per la stampa, a partire da
// incontri-data.json e una cartella con le illustrazioni generate: <id>.png/.jpg/.webp
//
// Uso:
//   node render-incontri.js <artDir> <outDir> [deck]
// Se si passa un terzo argomento (es. "elementare"), renderizza solo quel mazzo
// invece di tutti e 98 — comodo mentre le illustrazioni arrivano un mazzo alla volta.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { incontroPageHtml, PORTRAIT_CARD_W, PORTRAIT_CARD_H } = require('./template.js');

async function main() {
  const artDir = process.argv[2] || path.join(__dirname, '..', 'assets', 'cards');
  const outDir = process.argv[3] || path.join(__dirname, '..', 'cards_final', 'incontri');
  const deckFilter = process.argv[4] || null;

  let cards = JSON.parse(fs.readFileSync(path.join(__dirname, 'incontri-data.json'), 'utf8'));
  if (deckFilter) cards = cards.filter(c => c.deck === deckFilter);
  if (cards.length === 0) { console.error('Nessuna carta trovata' + (deckFilter ? ` per il mazzo "${deckFilter}"` : '') + '.'); process.exit(1); }

  fs.mkdirSync(outDir, { recursive: true });

  const html = incontroPageHtml(cards, fs.existsSync(artDir) ? artDir : null);
  const htmlPath = path.join(__dirname, '_render-incontri.html');
  fs.writeFileSync(htmlPath, html);

  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium',
  });
  const page = await browser.newPage({ viewport: { width: PORTRAIT_CARD_W + 200, height: PORTRAIT_CARD_H + 100 } });
  await page.goto('file://' + htmlPath);
  await page.waitForTimeout(3000);

  let missing = 0;
  for (const card of cards) {
    const el = await page.$(`#card-${card.id}`);
    if (!el) { console.log('MANCA nel DOM:', card.id); continue; }
    const outPath = path.join(outDir, card.id + '.png');
    await el.screenshot({ path: outPath });
    const hasArt = fs.existsSync(artDir) && ['.png', '.jpg', '.jpeg', '.webp'].some(ext => fs.existsSync(path.join(artDir, card.id + ext)));
    if (!hasArt) missing++;
    console.log((hasArt ? 'OK   ' : 'PLACEHOLDER '), card.deck, card.id, '->', outPath);
  }

  await browser.close();
  console.log(`\nFatto: ${cards.length} carte renderizzate in ${outDir}`);
  if (missing) console.log(`${missing} carte usano ancora il segnaposto (immagine non trovata in ${artDir}).`);
}

main().catch(err => { console.error(err); process.exit(1); });
