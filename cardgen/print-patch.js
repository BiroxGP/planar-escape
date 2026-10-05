// Foglio "patch": una o più pagine A4 con solo le carte appena cambiate, invece del
// mazzo intero — utile quando si è già stampato tutto e serve sostituire solo poche carte.
// Griglia automatica (come print-pnp.js) invece di posizioni manuali: tutte le carte finora
// usate in questo script sono formato Poker reale (63,5x88mm), quindi non serve più gestire
// formati misti a mano.
//
// Uso: node print-patch.js
// (l'elenco delle carte è hardcoded qui sotto — si modifica a mano per ogni "patch" one-off)

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const { convertAll } = require('./png-to-jpg-cache.js');

const CARDS_DIR = path.join(__dirname, '..', 'assets', 'cards');
const RETRO_DIR = path.join(__dirname, '..', 'cards_final', 'retro');
const JPG_CACHE_DIR = path.join(__dirname, '..', 'cards_final', 'print', '_jpgcache');
const OUT_DIR = path.join(__dirname, '..', 'cards_final', 'print');
const PAGE_W_MM = 210, PAGE_H_MM = 297, MARGIN_MM = 10;
const CARD_W_MM = 63.5, CARD_H_MM = 88;

// items: {id, back} — formato Poker reale per tutte, griglia automatica.
// PATCH_ITEMS=<file.json> e PATCH_NAME=<nome> permettono un foglio temporaneo senza toccare questo elenco
const ITEMS_DEFAULT = [
  { id: 'sciamano', back: 'retro_classi' },
  { id: 'barbaro', back: 'retro_classi' },
  { id: 'warlock', back: 'retro_classi' },
  { id: 'negromante', back: 'retro_classi' },
  { id: 'monaco', back: 'retro_classi' },
  { id: 'guerriero', back: 'retro_classi' },
  { id: 'paladino', back: 'retro_classi' },
  { id: 'sp_sigillo', back: 'retro_spell_flusso' },
];
const ITEMS = process.env.PATCH_ITEMS ? JSON.parse(fs.readFileSync(process.env.PATCH_ITEMS, 'utf8')) : ITEMS_DEFAULT;
const OUT_NAME = process.env.PATCH_NAME || 'patch';

function buildGrid() {
  const usableW = PAGE_W_MM - 2 * MARGIN_MM;
  const usableH = PAGE_H_MM - 2 * MARGIN_MM;
  const cols = Math.floor(usableW / CARD_W_MM);
  const rows = Math.floor(usableH / CARD_H_MM);
  const gridW = cols * CARD_W_MM, gridH = rows * CARD_H_MM;
  const offsetXmm = (PAGE_W_MM - gridW) / 2;
  const offsetYmm = (PAGE_H_MM - gridH) / 2;
  return { cols, rows, offsetXmm, offsetYmm };
}

function sheetsHtml(pages) {
  const pageDivs = pages.map(cells => `
    <div class="sheet">
      ${cells.map(c => `<div class="cell" style="left:${c.x}mm; top:${c.y}mm; width:${CARD_W_MM}mm; height:${CARD_H_MM}mm;">
        <img src="${c.src}">
        <i class="crop tl"></i><i class="crop tr"></i><i class="crop bl"></i><i class="crop br"></i>
      </div>`).join('')}
    </div>`).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{ background:#fff; }
    .sheet{ position:relative; width:${PAGE_W_MM}mm; height:${PAGE_H_MM}mm; page-break-after:always; }
    .cell{ position:absolute; }
    .cell img{ display:block; width:100%; height:100%; }
    .crop{ position:absolute; display:block; }
    .crop.tl{ left:-3.5mm; top:0; width:3mm; height:.25mm; background:#999; }
    .crop.tl::after{ content:''; position:absolute; left:0; top:-3.5mm; width:.25mm; height:3mm; background:#999; }
    .crop.tr{ right:-3.5mm; top:0; width:3mm; height:.25mm; background:#999; }
    .crop.tr::after{ content:''; position:absolute; right:0; top:-3.5mm; width:.25mm; height:3mm; background:#999; }
    .crop.bl{ left:-3.5mm; bottom:0; width:3mm; height:.25mm; background:#999; }
    .crop.bl::after{ content:''; position:absolute; left:0; bottom:-3.5mm; width:.25mm; height:3mm; background:#999; }
    .crop.br{ right:-3.5mm; bottom:0; width:3mm; height:.25mm; background:#999; }
    .crop.br::after{ content:''; position:absolute; right:0; bottom:-3.5mm; width:.25mm; height:3mm; background:#999; }
  </style></head><body>${pageDivs}</body></html>`;
}

function buildPages(mirror) {
  const { cols, rows, offsetXmm, offsetYmm } = buildGrid();
  const perPage = cols * rows;
  const pageCount = Math.ceil(ITEMS.length / perPage);
  const pages = [];
  for (let p = 0; p < pageCount; p++) {
    const pageItems = ITEMS.slice(p * perPage, (p + 1) * perPage);
    const cells = pageItems.map((it, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const y = offsetYmm + row * CARD_H_MM;
      const drawCol = mirror ? (cols - 1 - col) : col;
      const x = offsetXmm + drawCol * CARD_W_MM;
      const fileId = mirror ? it.back : it.id;
      const src = pathToFileURL(path.join(JPG_CACHE_DIR, fileId + '.jpg')).href;
      return { x, y, src };
    });
    pages.push(cells);
  }
  return pages;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const pairs = [];
  const seen = new Set();
  for (const it of ITEMS) {
    if (!seen.has(it.id)) { seen.add(it.id); pairs.push({ id: it.id, srcDir: CARDS_DIR, outDir: JPG_CACHE_DIR }); }
    if (!seen.has(it.back)) { seen.add(it.back); pairs.push({ id: it.back, srcDir: RETRO_DIR, outDir: JPG_CACHE_DIR }); }
  }
  console.log(`Conversione JPEG: ${pairs.length} immagini uniche...`);
  await convertAll(pairs);

  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });

  async function renderPdf(mirror, outFile) {
    const html = sheetsHtml(buildPages(mirror));
    const htmlPath = path.join(__dirname, '_print-patch-tmp-' + (mirror ? 'retro' : 'fronte') + '.html');
    fs.writeFileSync(htmlPath, html);
    const page = await browser.newPage();
    await page.goto('file://' + htmlPath + '?t=' + Date.now()); // cache-buster: Chromium può cache-are l'URL file:// per path, servendo una versione vecchia se il contenuto cambia tra run
    await page.pdf({ path: outFile, printBackground: true, width: `${PAGE_W_MM}mm`, height: `${PAGE_H_MM}mm`, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    await page.close();
    fs.unlinkSync(htmlPath);
  }

  await renderPdf(false, path.join(OUT_DIR, OUT_NAME + '_fronte.pdf'));
  await renderPdf(true, path.join(OUT_DIR, OUT_NAME + '_retro.pdf'));
  await browser.close();
  console.log(`Fatto: ${OUT_NAME}_fronte.pdf / ${OUT_NAME}_retro.pdf (${ITEMS.length} carte)`);
}

main().catch(e => { console.error(e); process.exit(1); });
