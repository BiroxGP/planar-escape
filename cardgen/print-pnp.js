// Genera fogli A4 pronti da stampare (print-and-play) per una categoria di carte:
// una griglia di fronti a dimensione fisica reale, più un foglio di retri nella
// stessa griglia ma con le colonne specchiate per riga — così, stampando i fronti
// e poi i retri sullo stesso tipo di foglio e allineandoli (a occhio o controluce),
// il retro di ogni carta finisce dietro al proprio fronte quando si ritaglia.
//
// Uso: node print-pnp.js <categoria>
//   categoria: piani | piano_terreno | classi | oggetti | spell | incontri | tutte

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const { convertAll } = require('./png-to-jpg-cache.js');

const JPG_CACHE_DIR = path.join(__dirname, '..', 'cards_final', 'print', '_jpgcache');

// A4 VERTICALE (non orizzontale): molti visualizzatori/stampanti, quando il PDF ha una
// pagina più larga che alta, la ruotano di 90° per adattarla al foglio portrait di default
// — la rotazione da sola non sposterebbe nulla, ma spesso viene applicata insieme a uno
// scalamento "adatta alla pagina" che rompe l'allineamento fronte/retro. Restando su
// verticale (il formato che ogni stampante assume di default) si evita l'ambiguità.
const PAGE_W_MM = 210, PAGE_H_MM = 297;
const MARGIN_MM = 5; // margine di sicurezza: molte stampanti non arrivano al bordo assoluto
const RULER_MM = 40; // riga di calibrazione: se non misura esattamente questo in stampa, la scala è sbagliata

const CARDS_DIR = path.join(__dirname, '..', 'assets', 'cards');
const RETRO_DIR = path.join(__dirname, '..', 'cards_final', 'retro');

function loadIds(jsonFile) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, jsonFile), 'utf8')).map(x => x.id);
}
const incontriData = JSON.parse(fs.readFileSync(path.join(__dirname, 'incontri-data.json'), 'utf8'));
const spellsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'spells-data.json'), 'utf8'));

const INCONTRO_BACK = { elementare: 'retro_incontro_elementare', eterei: 'retro_incontro_eterei', armonia: 'retro_incontro_armonia', entropia: 'retro_incontro_entropia', demoniaco: 'retro_incontro_demoni', nonmorti: 'retro_incontro_nonmorti', generico: 'retro_incontro_generico' };
const SPELL_BACK = { essenza: 'retro_spell_essenza', flusso: 'retro_spell_flusso', divinazione: 'retro_spell_divinazione' };

const CATEGORIES = {
  // formato Tarocco reale (120x70mm), orientamento carta (paesaggio) — già esatto, nessun ricomposizione necessaria.
  // ruler:false — scala/allineamento già validati dall'utente stampando i Piani: il
  // righello occuperebbe una riga intera (1 colonna sola) sprecando carta senza motivo,
  // visto che 4 carte per pagina entrano davvero (già testato su carta vera).
  piani: { cardWmm: 120, cardHmm: 70, ruler: false, items: loadIds('piani-data.json').map(id => ({ id, back: 'retro_piani' })) },
  piano_terreno: { cardWmm: 120, cardHmm: 70, ruler: false, items: loadIds('piano-terreno-data.json').map(id => ({ id, back: 'retro_piani' })) },
  // Classi: arte NON ricomposta a formato Poker reale — manca l'illustrazione grezza in
  // cards_raw per 11 classi su 13 (solo druido/sciamano ce l'hanno), quindi ricomporre
  // avrebbe voluto dire ritagliare/deformare le altre 11 senza un originale pulito da cui
  // ripartire. Restano al formato precedente (63x94mm) finché non arrivano le illustrazioni
  // grezze mancanti — leggermente più alto delle altre carte Poker (94 vs 88mm).
  classi: { cardWmm: 63, cardHmm: 94, items: loadIds('classes-data.json').map(id => ({ id, back: 'retro_classi' })) },
  // formato Poker reale (63,5x88mm)
  oggetti: { cardWmm: 63.5, cardHmm: 88, items: loadIds('oggetti-data.json').map(id => ({ id, back: 'retro_oggetto' })) },
  spell: { cardWmm: 63.5, cardHmm: 88, items: spellsData.map(s => ({ id: s.id, back: SPELL_BACK[s.school] })) },
  incontri: { cardWmm: 63.5, cardHmm: 88, items: incontriData.map(c => ({ id: c.id, back: INCONTRO_BACK[c.family] })) },
};

// striscia fissa riservata in basso per il righello di calibrazione: sottraendola SEMPRE
// dall'area disponibile (invece di infilare il righello nel margine avanzato, che con
// griglie 3x3 a formato Poker non lascia abbastanza spazio) il righello ha sempre lo
// stesso posto, su ogni categoria, indipendentemente da quante carte entrano per riga.
const RULER_STRIP_MM = 25;

function buildGrid(cardWmm, cardHmm, withRuler) {
  const usableW = PAGE_W_MM - 2 * MARGIN_MM;
  const usableH = PAGE_H_MM - 2 * MARGIN_MM - (withRuler ? RULER_STRIP_MM : 0);
  const cols = Math.floor(usableW / cardWmm);
  const rows = Math.floor(usableH / cardHmm);
  const gridW = cols * cardWmm, gridH = rows * cardHmm;
  // griglia centrata nell'area sopra la striscia del righello (se presente)
  const offsetXmm = (PAGE_W_MM - gridW) / 2;
  const offsetYmm = MARGIN_MM + (usableH - gridH) / 2;
  return { cols, rows, offsetXmm, offsetYmm };
}

function sheetsHtml(pages, cardWmm, cardHmm, rulerX, rulerY) {
  const ticks = [];
  for (let m = 0; m <= RULER_MM; m += 10) ticks.push(m);
  const rulerHtml = rulerX == null ? '' : `<div class="ruler" style="left:${rulerX}mm; top:${rulerY}mm;">
    <div class="ruler-bar"></div>
    ${ticks.map(m => `<i class="tick" style="left:${m}mm;"></i>`).join('')}
    <div class="ruler-label">Righello di calibrazione: deve misurare esattamente ${RULER_MM}mm. Se non combacia, stampa a dimensione reale (100%), non "adatta alla pagina".</div>
  </div>`;
  const pageDivs = pages.map(cells => `
    <div class="sheet">
      ${cells.map(c => `<div class="cell" style="left:${c.x}mm; top:${c.y}mm; width:${cardWmm}mm; height:${cardHmm}mm;">
        <img src="${c.src}">
        <i class="crop tl"></i><i class="crop tr"></i><i class="crop bl"></i><i class="crop br"></i>
      </div>`).join('')}
      ${rulerHtml}
    </div>`).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{ background:#fff; }
    .sheet{ position:relative; width:${PAGE_W_MM}mm; height:${PAGE_H_MM}mm; page-break-after:always; }
    .cell{ position:absolute; }
    .cell img{ display:block; width:100%; height:100%; }
    .ruler{ position:absolute; width:${RULER_MM}mm; }
    .ruler-bar{ width:${RULER_MM}mm; height:.3mm; background:#000; }
    .ruler .tick{ position:absolute; top:-1mm; width:.3mm; height:2.3mm; background:#000; }
    .ruler-label{ margin-top:1.5mm; width:100mm; margin-left:${(RULER_MM - 100) / 2}mm; text-align:center; font-family:sans-serif; font-size:2.6mm; line-height:1.35; color:#333; }
    /* mirini di taglio: un trattino corto appena fuori da ogni angolo della carta */
    .crop{ position:absolute; display:block; }
    .crop.tl{ left:-3.5mm; top:0; width:3mm; height:.25mm; background:#999; box-shadow:0 0 0 .125mm #999; }
    .crop.tl::after{ content:''; position:absolute; left:0; top:-3.5mm; width:.25mm; height:3mm; background:#999; }
    .crop.tr{ right:-3.5mm; top:0; width:3mm; height:.25mm; background:#999; }
    .crop.tr::after{ content:''; position:absolute; right:0; top:-3.5mm; width:.25mm; height:3mm; background:#999; }
    .crop.bl{ left:-3.5mm; bottom:0; width:3mm; height:.25mm; background:#999; }
    .crop.bl::after{ content:''; position:absolute; left:0; bottom:-3.5mm; width:.25mm; height:3mm; background:#999; }
    .crop.br{ right:-3.5mm; bottom:0; width:3mm; height:.25mm; background:#999; }
    .crop.br::after{ content:''; position:absolute; right:0; bottom:-3.5mm; width:.25mm; height:3mm; background:#999; }
  </style></head><body>${pageDivs}</body></html>`;
}

async function generateCategory(catName, cat, browser, outDir) {
  const withRuler = cat.ruler !== false;
  const { cols, rows, offsetXmm, offsetYmm } = buildGrid(cat.cardWmm, cat.cardHmm, withRuler);
  const perPage = cols * rows;
  // righello centrato orizzontalmente nella striscia riservata in fondo alla pagina (se presente)
  const rulerX = withRuler ? (PAGE_W_MM - RULER_MM) / 2 : null;
  const rulerY = withRuler ? PAGE_H_MM - MARGIN_MM - RULER_STRIP_MM + 6 : null;
  console.log(`[${catName}] griglia ${cols}x${rows} = ${perPage} carte/pagina${withRuler ? '' : ' (senza righello)'}`);

  const missingFront = cat.items.filter(it => !fs.existsSync(path.join(CARDS_DIR, it.id + '.png')));
  const missingBack = cat.items.filter(it => !it.back || !fs.existsSync(path.join(RETRO_DIR, it.back + '.png')));
  if (missingFront.length) console.warn(`  ATTENZIONE: fronte mancante per`, missingFront.map(x => x.id).join(', '));
  if (missingBack.length) console.warn(`  ATTENZIONE: retro mancante per`, missingBack.map(x => x.id).join(', '));

  const items = cat.items;
  const pageCount = Math.ceil(items.length / perPage);
  const frontPages = [], backPages = [];

  for (let p = 0; p < pageCount; p++) {
    const pageItems = items.slice(p * perPage, (p + 1) * perPage);
    const frontCells = [], backCells = [];
    for (let i = 0; i < pageItems.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = offsetXmm + col * cat.cardWmm;
      const y = offsetYmm + row * cat.cardHmm;
      const front = pathToFileURL(path.join(JPG_CACHE_DIR, pageItems[i].id + '.jpg')).href;
      frontCells.push({ x, y, src: front });
      // retro: stessa riga, colonna specchiata orizzontalmente — si stampa il foglio
      // dei fronti, si gira il foglio A4 da sinistra a destra (come si volta una pagina
      // di un quaderno panoramico) e si ristampa: ogni retro finisce dietro al suo fronte.
      const mirroredCol = cols - 1 - col;
      const bx = offsetXmm + mirroredCol * cat.cardWmm;
      const back = pathToFileURL(path.join(JPG_CACHE_DIR, pageItems[i].back + '.jpg')).href;
      backCells.push({ x: bx, y, src: back });
    }
    frontPages.push(frontCells);
    backPages.push(backCells);
  }

  async function renderPdf(pages, outFile) {
    const html = sheetsHtml(pages, cat.cardWmm, cat.cardHmm, rulerX, rulerY);
    const htmlPath = path.join(__dirname, '_print-tmp-' + catName + '.html');
    fs.writeFileSync(htmlPath, html);
    const page = await browser.newPage();
    await page.goto('file://' + htmlPath + '?t=' + Date.now()); // cache-buster: Chromium può cache-are l'URL file:// per path, servendo una versione vecchia se il contenuto cambia tra run
    await page.pdf({ path: outFile, printBackground: true, width: `${PAGE_W_MM}mm`, height: `${PAGE_H_MM}mm`, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    await page.close();
    fs.unlinkSync(htmlPath);
  }

  const frontPdf = path.join(outDir, catName + '_fronte.pdf');
  const backPdf = path.join(outDir, catName + '_retro.pdf');
  await renderPdf(frontPages, frontPdf);
  await renderPdf(backPages, backPdf);
  console.log(`  Fatto: ${pageCount} pagine, ${items.length} carte -> ${path.basename(frontPdf)} / ${path.basename(backPdf)}`);
}

async function main() {
  const arg = process.argv[2] || 'piani';
  const names = arg === 'tutte' ? Object.keys(CATEGORIES) : [arg];
  for (const n of names) {
    if (!CATEGORIES[n]) { console.error('Categoria sconosciuta:', n, '— disponibili:', Object.keys(CATEGORIES).join(', '), 'o "tutte"'); process.exit(1); }
  }
  const outDir = path.join(__dirname, '..', 'cards_final', 'print');
  fs.mkdirSync(outDir, { recursive: true });

  // prima si converte in JPEG (cache) tutto ciò che serve — fronti da assets/cards,
  // retri da cards_final/retro — poi si generano i PDF a partire dalla cache, molto
  // più leggeri dei PNG originali senza perdita percepibile a 300 DPI.
  const seen = new Set();
  const pairs = [];
  for (const n of names) {
    for (const it of CATEGORIES[n].items) {
      if (!seen.has(it.id)) { seen.add(it.id); pairs.push({ id: it.id, srcDir: CARDS_DIR, outDir: JPG_CACHE_DIR }); }
      if (it.back && !seen.has(it.back)) { seen.add(it.back); pairs.push({ id: it.back, srcDir: RETRO_DIR, outDir: JPG_CACHE_DIR }); }
    }
  }
  console.log(`Conversione JPEG: ${pairs.length} immagini uniche...`);
  await convertAll(pairs);

  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  for (const n of names) {
    await generateCategory(n, CATEGORIES[n], browser, outDir);
  }
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
