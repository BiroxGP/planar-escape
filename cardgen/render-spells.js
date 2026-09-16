// Renderizza le carte Spell (31, sulle 3 scuole: essenza, flusso, divinazione) in PNG
// pronti per la stampa, a partire da spells-data.json, spell-flavors.json (una riga
// d'atmosfera per spell, opzionale) e una cartella con le illustrazioni generate:
// <id>.png/.jpg/.webp, più i sigilli di scuola condivisi icon_essenza/icon_flusso/
// icon_divinazione.png/.jpg/.webp (mostrati come badge luminoso in alto a sinistra).
//
// Uso:
//   node render-spells.js <artDir> <outDir> [id1,id2,...]
// Il terzo argomento, opzionale, filtra a una lista di id — comodo per aggiornare solo
// gli spell che hanno appena ricevuto un'illustrazione, senza rischiare segnaposto sugli
// altri.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { spellPageHtml, PORTRAIT_CARD_W, PORTRAIT_CARD_H } = require('./template.js');

async function main() {
  const artDir = process.argv[2] || path.join(__dirname, '..', 'assets', 'cards');
  const outDir = process.argv[3] || path.join(__dirname, '..', 'cards_final', 'spells');
  const idFilter = process.argv[4] ? process.argv[4].split(',') : null;

  let spells = JSON.parse(fs.readFileSync(path.join(__dirname, 'spells-data.json'), 'utf8'));
  if (idFilter) spells = spells.filter(s => idFilter.includes(s.id));
  if (spells.length === 0) { console.error('Nessuno spell trovato per il filtro "' + (idFilter||[]).join(',') + '".'); process.exit(1); }
  const flavorsPath = path.join(__dirname, 'spell-flavors.json');
  const flavors = fs.existsSync(flavorsPath) ? JSON.parse(fs.readFileSync(flavorsPath, 'utf8')) : {};

  fs.mkdirSync(outDir, { recursive: true });

  const html = spellPageHtml(spells, flavors, fs.existsSync(artDir) ? artDir : null);
  const htmlPath = path.join(__dirname, '_render-spells.html');
  fs.writeFileSync(htmlPath, html);

  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium',
  });
  const page = await browser.newPage({ viewport: { width: PORTRAIT_CARD_W + 200, height: PORTRAIT_CARD_H + 100 } });
  await page.goto('file://' + htmlPath);
  await page.waitForTimeout(3000);

  let missing = 0;
  for (const sp of spells) {
    const el = await page.$(`#card-${sp.id}`);
    if (!el) { console.log('MANCA nel DOM:', sp.id); continue; }
    const outPath = path.join(outDir, sp.id + '.png');
    await el.screenshot({ path: outPath });
    const hasArt = fs.existsSync(artDir) && ['.png', '.jpg', '.jpeg', '.webp'].some(ext => fs.existsSync(path.join(artDir, sp.id + ext)));
    if (!hasArt) missing++;
    console.log((hasArt ? 'OK   ' : 'PLACEHOLDER '), sp.school, sp.id, '->', outPath);
  }

  await browser.close();
  console.log(`\nFatto: ${spells.length} carte renderizzate in ${outDir}`);
  if (missing) console.log(`${missing} carte usano ancora il segnaposto (immagine non trovata in ${artDir}).`);
}

main().catch(err => { console.error(err); process.exit(1); });
