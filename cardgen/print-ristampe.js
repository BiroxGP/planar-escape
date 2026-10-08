// Foglio "ristampe": le carte cambiate dopo l'ultima stampa (elenco in CARTE_DA_RISTAMPARE.md,
// sezione "Da ristampare"), anche di formati diversi (Poker 63,5x88 e Tarocco orizzontale
// 120x70) sullo stesso foglio. Un unico PDF: fronte e retro a pagine alternate (1 fronte, 2 retro,
// 3 fronte, ...) cosi' si stampa fronte/retro in un colpo solo; il retro e' specchiato in
// orizzontale (ribaltamento sul lato lungo).
//
// Uso: node print-ristampe.js           -> cards_final/print/ristampe_fronte_retro.pdf
// L'elenco RISTAMPE qui sotto si aggiorna a mano insieme al changelog.
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const { convertAll } = require('./png-to-jpg-cache.js');

const CARDS_DIR = path.join(__dirname, '..', 'assets', 'cards');
const RETRO_DIR = path.join(__dirname, '..', 'cards_final', 'retro');
const JPG_CACHE_DIR = path.join(__dirname, '..', 'cards_final', 'print', '_jpgcache');
const OUT_DIR = path.join(__dirname, '..', 'cards_final', 'print');
const PAGE_W_MM = 210, PAGE_H_MM = 297, MARGIN_MM = 8;
const POKER = { w: 63.5, h: 88 }, TAROCCO = { w: 120, h: 70 };

const RISTAMPE = [
  { id: 'o_bacchettarinvio', back: 'retro_oggetto', ...POKER },      // Bacchetta del Rinvio: annulla l'Incontro per tutti
  { id: 'veggente', back: 'retro_classi', ...POKER },                // Veggente: Intelletto 3, abilita' passiva
  { id: 'en_spettro', back: 'retro_incontro_entropia', ...POKER },   // Spettro del Tempo: da verificare (testo con "oltre ai PV")
  { id: 'antro_creatura', back: 'retro_piani', ...TAROCCO },         // L'Antro della Creatura: statistica a scelta
];

// impaginazione "a righe": le carte si affiancano finche' c'e' spazio in larghezza, poi si va a capo
function layout() {
  const usableW = PAGE_W_MM - 2 * MARGIN_MM, usableH = PAGE_H_MM - 2 * MARGIN_MM;
  const pages = [];
  let page = [], rows = [], row = [], rowW = 0, rowH = 0, y = 0;
  const flushRow = () => {
    if (!row.length) return;
    const x0 = (PAGE_W_MM - rowW) / 2;
    let x = x0;
    for (const it of row) { page.push({ ...it, x, y: MARGIN_MM + y }); x += it.w; }
    y += rowH; row = []; rowW = 0; rowH = 0;
  };
  for (const it of RISTAMPE) {
    if (rowW + it.w > usableW) flushRow();
    if (y + Math.max(rowH, it.h) > usableH) { flushRow(); if (page.length) { pages.push(page); page = []; y = 0; } }
    row.push(it); rowW += it.w; rowH = Math.max(rowH, it.h);
  }
  flushRow();
  if (page.length) pages.push(page);
  return pages;
}

function sheetHtml(pages) {
  const sheets = [];
  pages.forEach((cells, i) => {
    for (const side of ['fronte', 'retro']) {
      const body = cells.map(c => {
        const x = side === 'retro' ? PAGE_W_MM - c.x - c.w : c.x;
        const file = side === 'retro' ? c.back : c.id;
        const src = pathToFileURL(path.join(JPG_CACHE_DIR, file + '.jpg')).href;
        return `<div class="cell" style="left:${x}mm; top:${c.y}mm; width:${c.w}mm; height:${c.h}mm;"><img src="${src}"><i class="crop tl"></i><i class="crop tr"></i><i class="crop bl"></i><i class="crop br"></i></div>`;
      }).join('\n');
      sheets.push(`<div class="sheet">${body}<div class="note">Ristampe — foglio ${i + 1} — ${side}${side === 'retro' ? ' (specchiato: stampa fronte/retro sul lato lungo)' : ''}</div></div>`);
    }
  });
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{ background:#fff; }
    .sheet{ position:relative; width:${PAGE_W_MM}mm; height:${PAGE_H_MM}mm; overflow:hidden; }
    .sheet + .sheet{ page-break-before:always; }
    .cell{ position:absolute; }
    .cell img{ display:block; width:100%; height:100%; }
    .note{ position:absolute; left:0; right:0; bottom:3mm; text-align:center; font-family:sans-serif; font-size:2.6mm; color:#666; }
    .crop{ position:absolute; display:block; }
    .crop.tl{ left:-3.5mm; top:0; width:3mm; height:.25mm; background:#999; }
    .crop.tl::after{ content:''; position:absolute; left:0; top:-3.5mm; width:.25mm; height:3mm; background:#999; }
    .crop.tr{ right:-3.5mm; top:0; width:3mm; height:.25mm; background:#999; }
    .crop.tr::after{ content:''; position:absolute; right:0; top:-3.5mm; width:.25mm; height:3mm; background:#999; }
    .crop.bl{ left:-3.5mm; bottom:0; width:3mm; height:.25mm; background:#999; }
    .crop.bl::after{ content:''; position:absolute; left:0; bottom:-3.5mm; width:.25mm; height:3mm; background:#999; }
    .crop.br{ right:-3.5mm; bottom:0; width:3mm; height:.25mm; background:#999; }
    .crop.br::after{ content:''; position:absolute; right:0; bottom:-3.5mm; width:.25mm; height:3mm; background:#999; }
  </style></head><body>${sheets.join('\n')}</body></html>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const pairs = [];
  const seen = new Set();
  for (const it of RISTAMPE) {
    if (!seen.has(it.id)) { seen.add(it.id); pairs.push({ id: it.id, srcDir: CARDS_DIR, outDir: JPG_CACHE_DIR }); }
    if (!seen.has(it.back)) { seen.add(it.back); pairs.push({ id: it.back, srcDir: RETRO_DIR, outDir: JPG_CACHE_DIR }); }
  }
  await convertAll(pairs);
  const pages = layout();
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const tmp = path.join(__dirname, '_tmp-ristampe-' + Date.now() + '.html');
  fs.writeFileSync(tmp, sheetHtml(pages));
  const page = await browser.newPage();
  await page.goto('file://' + tmp);
  const out = path.join(OUT_DIR, 'ristampe_fronte_retro.pdf');
  await page.pdf({ path: out, printBackground: true, width: `${PAGE_W_MM}mm`, height: `${PAGE_H_MM}mm`, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await page.setViewportSize({ width: 794, height: 1123 });
  const full = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: path.join(__dirname, '..', 'cards_final', 'altro', 'ristampe_anteprima.png'), fullPage: true });
  fs.unlinkSync(tmp);
  await browser.close();
  console.log(`Fatto: ristampe_fronte_retro.pdf (${RISTAMPE.length} carte su ${pages.length} foglio/i, fronte+retro) in ${OUT_DIR}`);
}
main().catch(e => { console.error(e); process.exit(1); });
