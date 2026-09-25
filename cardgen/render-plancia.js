// Plancia Giocatore: un'unica board generica (non per classe — la carta Classe fisica si
// posa nello slot a sinistra durante la partita), con le 6 caselle dado già colorate
// dall'utente sovrapposte di icona+etichetta statistica. Le due posizioni delle caselle
// (misurate per colore via canvas su plancia_giocatore.jpg, in ordine di lettura come
// l'array STATS del gioco: for,int,des / pv,san,anima) e la stessa palette dei dadi usata
// nell'app dove esiste già (pv=rosso/--bad, san=viola/--arcane — coincidenza col disegno
// dell'utente, per int/des/for/anima non c'era una convenzione preesistente).
//
// Uso: node render-plancia.js

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const SRC_IMG = path.join(__dirname, '..', 'assets', 'ui', 'plancia_giocatore.jpg');
const OUT_DIR = path.join(__dirname, '..', 'cards_final', 'plancia');
const W = 2912, H = 1440;

const STAT_ICON = { for: '💪', int: '🧠', des: '🏃', pv: '❤️', san: '🌀', anima: '🕯️' };
const STAT_LABEL = { for: 'Forza', int: 'Intelletto', des: 'Destrezza', pv: 'Punti Vita', san: 'Sanità Mentale', anima: 'Anima' };
// posizione delle 6 caselle, in % dell'immagine — griglia 2x3, stesso ordine di lettura
// dell'array STATS del gioco (for,int,des poi pv,san,anima)
const SLOTS = [
  { stat: 'for',   left: 33.58, top: 19.79 },
  { stat: 'int',   left: 54.60, top: 19.79 },
  { stat: 'des',   left: 75.00, top: 19.79 },
  { stat: 'pv',    left: 33.58, top: 54.17 },
  { stat: 'san',   left: 54.60, top: 54.17 },
  { stat: 'anima', left: 75.00, top: 54.17 },
];
const SLOT_W = 12.36, SLOT_H = 24.79;

function frontHtml() {
  const imgUrl = pathToFileURL(SRC_IMG).href;
  const slotsHtml = SLOTS.map(s => `
    <div class="slot" style="left:${s.left}%; top:${s.top}%; width:${SLOT_W}%; height:${SLOT_H}%;">
      <div class="ic">${STAT_ICON[s.stat]}</div>
      <div class="lbl">${STAT_LABEL[s.stat]}</div>
    </div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@600;700&display=swap">
  <style>
    *{box-sizing:border-box; margin:0; padding:0;}
    body{ width:${W}px; height:${H}px; position:relative; background:#000; }
    .board{ position:absolute; inset:0; width:100%; height:100%; }
    .slot{ position:absolute; display:flex; flex-direction:column; align-items:center; justify-content:center; }
    .ic{ font-size:78px; line-height:1; filter:drop-shadow(0 2px 4px rgba(0,0,0,.35)); }
    .lbl{
      margin-top:10px; font-family:'JetBrains Mono',monospace; font-weight:700; font-size:26px;
      letter-spacing:.03em; text-transform:uppercase; color:#3a3228; text-align:center;
      text-shadow:0 1px 0 rgba(255,255,255,.25);
    }
  </style></head>
  <body>
    <img class="board" src="${imgUrl}">
    ${slotsHtml}
  </body></html>`;
}

function backHtml() {
  return `<!doctype html><html><head><meta charset="utf-8">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Source+Serif+4:ital@0;1&display=swap">
  <style>
    *{box-sizing:border-box; margin:0; padding:0;}
    body{ width:${W}px; height:${H}px; position:relative; background:radial-gradient(ellipse at center, #241f2c 0%, #14111a 70%, #0c0a10 100%); overflow:hidden; }
    .frame{
      position:absolute; inset:36px; border:3px solid #2f7d76; border-radius:28px;
      box-shadow:0 0 0 10px rgba(20,107,103,.12), inset 0 0 60px rgba(20,107,103,.18);
    }
    .frame::before{
      content:''; position:absolute; inset:16px; border:1px solid rgba(79,214,208,.45); border-radius:20px;
    }
    .emblem{
      position:absolute; top:50%; left:50%; transform:translate(-50%,-58%);
      width:300px; height:300px; border-radius:50%;
      border:3px solid #4fd6d0; box-shadow:0 0 40px rgba(79,214,208,.35), inset 0 0 30px rgba(79,214,208,.15);
      display:flex; align-items:center; justify-content:center;
      background:radial-gradient(circle, rgba(79,214,208,.10) 0%, transparent 70%);
    }
    .emblem .ic{ font-size:150px; filter:drop-shadow(0 0 18px rgba(79,214,208,.55)); }
    .title{
      position:absolute; top:50%; left:50%; transform:translate(-50%, 130px);
      font-family:'Cinzel',serif; font-weight:700; font-size:64px; letter-spacing:.08em;
      color:#f4ede0; text-shadow:0 0 22px rgba(79,214,208,.5), 0 2px 8px rgba(0,0,0,.6);
      white-space:nowrap;
    }
    .sub{
      position:absolute; top:50%; left:50%; transform:translate(-50%, 200px);
      font-family:'Source Serif 4',serif; font-style:italic; font-size:26px; letter-spacing:.02em;
      color:#b9c9c7; white-space:nowrap;
    }
    .corner{ position:absolute; width:14px; height:14px; border-radius:50%; background:#4fd6d0; box-shadow:0 0 12px rgba(79,214,208,.7); }
    .tl{ top:26px; left:26px; } .tr{ top:26px; right:26px; } .bl{ bottom:26px; left:26px; } .br{ bottom:26px; right:26px; }
  </style></head>
  <body>
    <div class="frame"></div>
    <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
    <div class="emblem"><div class="ic">🌀</div></div>
    <div class="title">PLANCIA GIOCATORE</div>
    <div class="sub">Planar Escape</div>
  </body></html>`;
}

// Foglio di stampa: 2 plance per A4 verticale (impilate), non 4 — a piena larghezza utile
// (200mm) la plancia verrebbe 200x98,9mm (stesso rapporto 2912:1440 dell'originale): già
// così 2 ne entrano comode (197,8mm di altezza usata su 287 disponibili), a 4 per foglio
// ognuna sarebbe larga solo ~100mm, troppo stretta per ospitare una carta poker (63,5mm)
// più 6 caselle dado leggibili accanto.
const PAGE_W_MM = 210, PAGE_H_MM = 297, MARGIN_MM = 5, GAP_MM = 5;
const BOARD_W_MM = PAGE_W_MM - 2 * MARGIN_MM;
const BOARD_H_MM = BOARD_W_MM * (H / W);

function printSheetHtml(imgFile) {
  const url = pathToFileURL(imgFile).href;
  const totalH = 2 * BOARD_H_MM + GAP_MM;
  const topOffset = MARGIN_MM + (PAGE_H_MM - 2 * MARGIN_MM - totalH) / 2;
  const cells = [0, 1].map(i => `
    <div class="cell" style="top:${topOffset + i * (BOARD_H_MM + GAP_MM)}mm; left:${MARGIN_MM}mm; width:${BOARD_W_MM}mm; height:${BOARD_H_MM}mm;">
      <img src="${url}">
      <i class="crop tl"></i><i class="crop tr"></i><i class="crop bl"></i><i class="crop br"></i>
    </div>`).join('');
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
  </style></head><body><div class="sheet">${cells}</div></body></html>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: W, height: H } });

  const frontPngPath = path.join(OUT_DIR, 'plancia_giocatore_fronte.png');
  const backPngPath = path.join(OUT_DIR, 'plancia_giocatore_retro.png');

  const frontPath = path.join(__dirname, '_render-plancia-fronte-' + Date.now() + '.html');
  fs.writeFileSync(frontPath, frontHtml());
  await page.goto('file://' + frontPath);
  await page.waitForTimeout(500);
  await page.screenshot({ path: frontPngPath });
  fs.unlinkSync(frontPath);

  const backPath = path.join(__dirname, '_render-plancia-retro-' + Date.now() + '.html');
  fs.writeFileSync(backPath, backHtml());
  await page.goto('file://' + backPath);
  await page.waitForTimeout(500);
  await page.screenshot({ path: backPngPath });
  fs.unlinkSync(backPath);

  const printPage = await browser.newPage();
  const printDir = path.join(__dirname, '..', 'cards_final', 'print');
  fs.mkdirSync(printDir, { recursive: true });

  const frontSheetPath = path.join(__dirname, '_plancia-print-fronte-' + Date.now() + '.html');
  fs.writeFileSync(frontSheetPath, printSheetHtml(frontPngPath));
  await printPage.goto('file://' + frontSheetPath);
  await printPage.pdf({ path: path.join(printDir, 'plancia_fronte.pdf'), printBackground: true, width: `${PAGE_W_MM}mm`, height: `${PAGE_H_MM}mm`, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  fs.unlinkSync(frontSheetPath);

  const backSheetPath = path.join(__dirname, '_plancia-print-retro-' + Date.now() + '.html');
  fs.writeFileSync(backSheetPath, printSheetHtml(backPngPath));
  await printPage.goto('file://' + backSheetPath);
  await printPage.pdf({ path: path.join(printDir, 'plancia_retro.pdf'), printBackground: true, width: `${PAGE_W_MM}mm`, height: `${PAGE_H_MM}mm`, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  fs.unlinkSync(backSheetPath);

  await browser.close();
  console.log('Fatto: plancia_giocatore_fronte.png / plancia_giocatore_retro.png in ' + OUT_DIR);
  console.log(`Fatto: plancia_fronte.pdf / plancia_retro.pdf (2 per foglio, ${BOARD_W_MM.toFixed(1)}x${BOARD_H_MM.toFixed(1)}mm ciascuna) in ${printDir}`);
}

main().catch(err => { console.error(err); process.exit(1); });
