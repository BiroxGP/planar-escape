// Foglio "patch": una singola pagina A4 con solo le carte appena cambiate, invece del
// mazzo intero — utile quando si è già stampato tutto e serve sostituire solo poche carte.
// Formati misti gestiti a mano (Tarocco 120x70mm per i Piani, Poker 63,5x88mm per il resto),
// niente griglia ripetuta: ogni carta ha una posizione esplicita.
//
// Uso: node print-patch.js
// (l'elenco delle carte è hardcoded qui sotto — si modifica a mano per ogni "patch" one-off)

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const JPG_CACHE_DIR = path.join(__dirname, '..', 'cards_final', 'print', '_jpgcache');
const OUT_DIR = path.join(__dirname, '..', 'cards_final', 'print');
const PAGE_W_MM = 210, PAGE_H_MM = 297;

// items: {id, back, x, y, w, h} — posizione/formato espliciti, niente griglia automatica.
const ITEMS = [
  { id: 'o_auraassorbente', back: 'retro_oggetto', x: 20, y: 15, w: 63.5, h: 88 },
];

function cellsHtml(items, mirror){
  return items.map(it=>{
    const src = pathToFileURL(path.join(JPG_CACHE_DIR, (mirror?it.back:it.id)+'.jpg')).href;
    const x = mirror ? (PAGE_W_MM - it.x - it.w) : it.x; // specchiato orizzontalmente per il foglio dei retri
    return `<div class="cell" style="left:${x}mm; top:${it.y}mm; width:${it.w}mm; height:${it.h}mm;">
      <img src="${src}">
      <i class="crop tl"></i><i class="crop tr"></i><i class="crop bl"></i><i class="crop br"></i>
    </div>`;
  }).join('');
}

function pageHtml(items, mirror){
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{ background:#fff; }
    .sheet{ position:relative; width:${PAGE_W_MM}mm; height:${PAGE_H_MM}mm; }
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
  </style></head><body><div class="sheet">${cellsHtml(items, mirror)}</div></body></html>`;
}

async function main(){
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });

  async function renderPdf(mirror, outFile){
    const html = pageHtml(ITEMS, mirror);
    const htmlPath = path.join(__dirname, '_print-patch-tmp.html');
    fs.writeFileSync(htmlPath, html);
    const page = await browser.newPage();
    await page.goto('file://' + htmlPath + '?t=' + Date.now()); // cache-buster: Chromium può cache-are l'URL file:// per path, servendo una versione vecchia se il contenuto cambia tra run
    await page.pdf({ path: outFile, printBackground: true, width: `${PAGE_W_MM}mm`, height: `${PAGE_H_MM}mm`, margin: { top:0, right:0, bottom:0, left:0 } });
    await page.close();
    fs.unlinkSync(htmlPath);
  }

  await renderPdf(false, path.join(OUT_DIR, 'patch_fronte.pdf'));
  await renderPdf(true, path.join(OUT_DIR, 'patch_retro.pdf'));
  await browser.close();
  console.log('Fatto: patch_fronte.pdf / patch_retro.pdf');
}

main().catch(e=>{ console.error(e); process.exit(1); });
