// Plancia Giocatore: un'unica board generica (non per classe — la carta Classe fisica si
// posa nello slot a sinistra durante la partita), con le 6 caselle dado già colorate
// dall'utente sovrapposte di icona statistica. L'icona sta SOPRA ogni casella (non dentro):
// dentro ci va il dado fisico vero durante la partita, e ci coprirebbe qualunque cosa
// stampata lì sotto. Ordine di lettura griglia 2x3 = stesso ordine dell'array STATS del
// gioco (for,int,des poi pv,san,anima) — non c'era altra convenzione preesistente che
// coprisse tutte e sei le statistiche.
//
// Quarta versione dell'immagine (26/09, "l'immagine è perfetta"): risoluzione più bassa
// (1520x1034 invece di 2506x1664) e proporzioni carta/dado finalmente quasi esatte — rapporto
// misurato ~4,0:1 contro il reale 4,23:1 (era 1,9:1 nella v1, 4,04:1 nella v2/v3: questa è
// la migliore finora). Ri-misurato tutto da zero (dimensioni e posizioni diverse dalle
// versioni precedenti).
//
// Scala reale: derivata dalla carta Classe (che va nello slot a sinistra), non dal dado —
// misurato lo slot carta sull'immagine (~424x608px) e forzato a 63,5mm di LARGHEZZA (formato
// Poker): a questa scala il dado viene ~15,9mm (praticamente esatto) e l'altezza slot carta
// ~91mm (reale 88mm, solo +3mm — il miglior risultato finora). Board risultante ~228x155mm:
// non entra in un A4 verticale, ma un A4 ORIZZONTALE sì (297x210mm) — 1 sola plancia a foglio.
//
// Uso: node render-plancia.js

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const SRC_IMG = path.join(__dirname, '..', 'assets', 'ui', 'plancia_giocatore.png');
const SRC_TOKENS = path.join(__dirname, '..', 'assets', 'ui', 'segnalini.jpg');
const OUT_DIR = path.join(__dirname, '..', 'cards_final', 'plancia');
const PRINT_DIR = path.join(__dirname, '..', 'cards_final', 'print');
const W = 1520, H = 1034;

const STAT_ICON = { for: '💪', int: '🧠', des: '🏃', pv: '❤️', san: '🌀', anima: '🕯️' };
const STAT_LABEL = { for: 'Forza', int: 'Intelletto', des: 'Destrezza', pv: 'Punti Vita', san: 'Sanità', anima: 'Anima' };
// posizione delle 6 caselle (misurate via campionamento colore su plancia_giocatore.png),
// griglia 2x3 nello stesso ordine di lettura dell'array STATS del gioco. topEdge/bottomEdge
// = dove inizia/finisce l'ombra/bevel della casella — l'icona si appoggia sopra a topEdge,
// l'etichetta sotto a bottomEdge (lati opposti del dado, non più impilate insieme).
const SLOTS = [
  { stat: 'for',   cx: 821,    topEdge: 314, bottomEdge: 428 },
  { stat: 'int',   cx: 999,    topEdge: 314, bottomEdge: 428 },
  { stat: 'des',   cx: 1172.5, topEdge: 314, bottomEdge: 428 },
  { stat: 'pv',    cx: 821,    topEdge: 592, bottomEdge: 708 },
  { stat: 'san',   cx: 997,    topEdge: 592, bottomEdge: 708 },
  { stat: 'anima', cx: 1171,   topEdge: 592, bottomEdge: 708 },
];
const ICON_H = 27; // altezza icona in px nativi — dimensionata per restare ~4mm reali come nella v3
const LABEL_PX = 15; // font-size dell'etichetta sotto il dado — ~2,3mm reali come nella v3

// Scala reale: vedi commento in testa al file. Slot carta misurato ~424px di larghezza,
// forzato a corrispondere a 63,5mm (formato Poker).
const CARD_SLOT_W_PX = 424;
const MM_PER_PX = 63.5 / CARD_SLOT_W_PX;
const BOARD_W_MM = W * MM_PER_PX;
const BOARD_H_MM = H * MM_PER_PX;

function frontHtml() {
  const imgUrl = pathToFileURL(SRC_IMG).href;
  const iconsHtml = SLOTS.map(s => `
    <div class="ic" style="left:${s.cx}px; bottom:${H - s.topEdge + 4}px;">${STAT_ICON[s.stat]}</div>`).join('');
  const labelsHtml = SLOTS.map(s => `
    <div class="lbl" style="left:${s.cx}px; top:${s.bottomEdge + 6}px;">${STAT_LABEL[s.stat]}</div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@600;700&display=swap">
  <style>
    *{box-sizing:border-box; margin:0; padding:0;}
    body{ width:${W}px; height:${H}px; position:relative; background:#000; }
    .board{ position:absolute; inset:0; width:100%; height:100%; }
    .ic{
      position:absolute; transform:translateX(-50%); font-size:${ICON_H}px; line-height:1;
      filter:drop-shadow(0 1px 3px rgba(0,0,0,.4));
    }
    .lbl{
      position:absolute; transform:translateX(-50%);
      font-family:'JetBrains Mono',monospace; font-weight:700; font-size:${LABEL_PX}px;
      letter-spacing:.02em; text-transform:uppercase; color:#4a4136; white-space:nowrap;
      text-shadow:0 1px 0 rgba(255,255,255,.3);
    }
  </style></head>
  <body>
    <img class="board" src="${imgUrl}">
    ${iconsHtml}
    ${labelsHtml}
  </body></html>`;
}

function backHtml() {
  // Sfondo chiaro invece che scuro: molto meno inchiostro in stampa (era un pieno quasi nero
  // su tutta la board). Stessa cornice/accento color portale, solo su base chiara.
  return `<!doctype html><html><head><meta charset="utf-8">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Source+Serif+4:ital@0;1&display=swap">
  <style>
    *{box-sizing:border-box; margin:0; padding:0;}
    body{ width:${W}px; height:${H}px; position:relative; background:#f6f2e9; overflow:hidden; }
    .frame{
      position:absolute; inset:36px; border:3px solid #146b67; border-radius:28px;
    }
    .frame::before{
      content:''; position:absolute; inset:16px; border:1px solid rgba(20,107,103,.4); border-radius:20px;
    }
    .title{
      position:absolute; top:50%; left:50%; transform:translate(-50%, -20px);
      font-family:'Cinzel',serif; font-weight:700; font-size:76px; letter-spacing:.08em;
      color:#2b2420; white-space:nowrap;
    }
    .sub{
      position:absolute; top:50%; left:50%; transform:translate(-50%, 60px);
      font-family:'Source Serif 4',serif; font-style:italic; font-size:30px; letter-spacing:.02em;
      color:#146b67; white-space:nowrap;
    }
    .corner{ position:absolute; width:12px; height:12px; border-radius:50%; background:#146b67; }
    .tl{ top:26px; left:26px; } .tr{ top:26px; right:26px; } .bl{ bottom:26px; left:26px; } .br{ bottom:26px; right:26px; }
  </style></head>
  <body>
    <div class="frame"></div>
    <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
    <div class="title">PLANCIA GIOCATORE</div>
    <div class="sub">Planar Escape</div>
  </body></html>`;
}

// Segnalini: due icone (freccia doppia su/giù) ritagliate da segnalini.jpg (2048x2048,
// sfondo nero) — stesso riquadro di ritaglio (670px) centrato su ciascuna, per una resa
// visiva coerente fra i due. Il cerchio-slot accanto ai dadi misura ~4,9mm di diametro alla
// scala della board v4 (era 10,5mm in v1, 6mm in v3): i segnalini vanno stampati a quella
// stessa dimensione.
const TOKEN_RENDER_PX = 500; // risoluzione del master, non la dimensione di stampa
const TOKEN_CROP = 670;
const TOKEN_MM = 5;
const TOKENS = {
  up:   { center: [664.5, 1026] },
  down: { center: [1378.5, 1023] },
};

function tokenHtml(key) {
  const t = TOKENS[key];
  const bgSize = 2048 * (TOKEN_RENDER_PX / TOKEN_CROP);
  const bgPosX = -(t.center[0] - TOKEN_CROP / 2) * (TOKEN_RENDER_PX / TOKEN_CROP);
  const bgPosY = -(t.center[1] - TOKEN_CROP / 2) * (TOKEN_RENDER_PX / TOKEN_CROP);
  const url = pathToFileURL(SRC_TOKENS).href;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;}
    body{ background:transparent; }
    .token{
      width:${TOKEN_RENDER_PX}px; height:${TOKEN_RENDER_PX}px; border-radius:50%; overflow:hidden;
      background-image:url(${url}); background-repeat:no-repeat;
      background-size:${bgSize}px ${bgSize}px; background-position:${bgPosX}px ${bgPosY}px;
    }
  </style></head><body><div class="token" id="token"></div></body></html>`;
}

function tokenSheetHtml(upFile, downFile, perType) {
  const url1 = pathToFileURL(upFile).href, url2 = pathToFileURL(downFile).href;
  const PAGE_W_MM = 210, PAGE_H_MM = 297, MARGIN_MM = 12, GAP_MM = 4;
  const cols = 6;
  const cells = [];
  for (let i = 0; i < perType; i++) {
    cells.push({ url: url1, col: i % cols, row: Math.floor(i / cols) });
  }
  const rowsUp = Math.ceil(perType / cols);
  for (let i = 0; i < perType; i++) {
    cells.push({ url: url2, col: i % cols, row: rowsUp + 1 + Math.floor(i / cols) });
  }
  const cellsHtml = cells.map(c => `
    <div class="tok" style="left:${MARGIN_MM + c.col * (TOKEN_MM + GAP_MM)}mm; top:${MARGIN_MM + c.row * (TOKEN_MM + GAP_MM)}mm;">
      <img src="${c.url}">
    </div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{ background:#fff; }
    .sheet{ position:relative; width:${PAGE_W_MM}mm; height:${PAGE_H_MM}mm; }
    .tok{ position:absolute; width:${TOKEN_MM}mm; height:${TOKEN_MM}mm; border-radius:50%; box-shadow:0 0 0 .2mm #999; }
    .tok img{ display:block; width:100%; height:100%; border-radius:50%; }
  </style></head><body><div class="sheet">${cellsHtml}</div></body></html>`;
}

const RULER_MM = 40; // se non misura esattamente questo in stampa, la scala è sbagliata (stampa a dimensione reale, non "adatta alla pagina")

function printSheetHtml(imgFile) {
  const url = pathToFileURL(imgFile).href;
  const PAGE_W_MM = 297, PAGE_H_MM = 210, MARGIN_MM = 5; // A4 ORIZZONTALE: la board (~228x155mm) non entra in verticale
  const left = (PAGE_W_MM - BOARD_W_MM) / 2, top = (PAGE_H_MM - BOARD_H_MM) / 2;
  const rulerX = (PAGE_W_MM - RULER_MM) / 2;
  const rulerY = top + BOARD_H_MM + 6;
  const ticks = []; for (let m = 0; m <= RULER_MM; m += 10) ticks.push(m);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{ background:#fff; }
    .sheet{ position:relative; width:${PAGE_W_MM}mm; height:${PAGE_H_MM}mm; }
    .cell{ position:absolute; left:${left}mm; top:${top}mm; width:${BOARD_W_MM}mm; height:${BOARD_H_MM}mm; }
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
    .ruler{ position:absolute; left:${rulerX}mm; top:${rulerY}mm; width:${RULER_MM}mm; }
    .ruler-bar{ width:${RULER_MM}mm; height:.3mm; background:#000; }
    .ruler .tick{ position:absolute; top:-1mm; width:.3mm; height:2.3mm; background:#000; }
    .ruler-label{ margin-top:1.5mm; width:100mm; margin-left:${(RULER_MM - 100) / 2}mm; text-align:center; font-family:sans-serif; font-size:2.6mm; line-height:1.35; color:#333; }
  </style></head><body><div class="sheet">
    <div class="cell"><img src="${url}"><i class="crop tl"></i><i class="crop tr"></i><i class="crop bl"></i><i class="crop br"></i></div>
    <div class="ruler">
      <div class="ruler-bar"></div>
      ${ticks.map(m => `<i class="tick" style="left:${m}mm;"></i>`).join('')}
      <div class="ruler-label">Righello di calibrazione: deve misurare esattamente ${RULER_MM}mm. Se non combacia, stampa a dimensione reale (100%), non "adatta alla pagina".</div>
    </div>
  </div></body></html>`;
}

async function renderHtmlToFile(browser, html, outPath, viewport) {
  const page = await browser.newPage({ viewport });
  const tmp = path.join(__dirname, '_tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.html');
  fs.writeFileSync(tmp, html);
  await page.goto('file://' + tmp);
  await page.waitForTimeout(400);
  await page.screenshot({ path: outPath, omitBackground: outPath.endsWith('.png') && html.includes('background:transparent') });
  fs.unlinkSync(tmp);
  await page.close();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PRINT_DIR, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });

  const frontPngPath = path.join(OUT_DIR, 'plancia_giocatore_fronte.png');
  const backPngPath = path.join(OUT_DIR, 'plancia_giocatore_retro.png');
  await renderHtmlToFile(browser, frontHtml(), frontPngPath, { width: W, height: H });
  await renderHtmlToFile(browser, backHtml(), backPngPath, { width: W, height: H });

  const upPngPath = path.join(OUT_DIR, 'segnalino_su.png');
  const downPngPath = path.join(OUT_DIR, 'segnalino_giu.png');
  await renderHtmlToFile(browser, tokenHtml('up'), upPngPath, { width: TOKEN_RENDER_PX, height: TOKEN_RENDER_PX });
  await renderHtmlToFile(browser, tokenHtml('down'), downPngPath, { width: TOKEN_RENDER_PX, height: TOKEN_RENDER_PX });

  const printPage = await browser.newPage();
  async function pdf(html, outFile, wMm, hMm) {
    const tmp = path.join(__dirname, '_tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.html');
    fs.writeFileSync(tmp, html);
    await printPage.goto('file://' + tmp);
    await printPage.pdf({ path: outFile, printBackground: true, width: `${wMm}mm`, height: `${hMm}mm`, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    fs.unlinkSync(tmp);
  }
  await pdf(printSheetHtml(frontPngPath), path.join(PRINT_DIR, 'plancia_fronte.pdf'), 297, 210);
  await pdf(printSheetHtml(backPngPath), path.join(PRINT_DIR, 'plancia_retro.pdf'), 297, 210);
  await pdf(tokenSheetHtml(upPngPath, downPngPath, 12), path.join(PRINT_DIR, 'segnalini.pdf'), 210, 297);

  await browser.close();
  console.log('Fatto: plancia_giocatore_fronte.png / _retro.png / segnalino_su.png / segnalino_giu.png in ' + OUT_DIR);
  console.log(`Fatto: plancia_fronte.pdf / plancia_retro.pdf (1 per foglio A4 orizzontale, ${BOARD_W_MM.toFixed(1)}x${BOARD_H_MM.toFixed(1)}mm) + segnalini.pdf (12 su + 12 giu, ${TOKEN_MM}mm ciascuno) in ${PRINT_DIR}`);
}

main().catch(err => { console.error(err); process.exit(1); });
