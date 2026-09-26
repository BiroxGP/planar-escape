// Plancia Giocatore: un'unica board generica (non per classe — la carta Classe fisica si
// posa nello slot a sinistra durante la partita), con le 6 caselle dado già colorate
// dall'utente sovrapposte di icona statistica. L'icona sta SOPRA ogni casella (non dentro):
// dentro ci va il dado fisico vero durante la partita, e ci coprirebbe qualunque cosa
// stampata lì sotto. Ordine di lettura griglia 2x3 = stesso ordine dell'array STATS del
// gioco (for,int,des poi pv,san,anima) — non c'era altra convenzione preesistente che
// coprisse tutte e sei le statistiche.
//
// Seconda versione dell'immagine (25/09→26/09): la prima aveva i dadi disegnati troppo
// grandi rispetto alla carta (rapporto carta/dado 1,9:1 invece del reale 4,2:1 = 63,5mm/15mm)
// — a scala-carta corretta il dado veniva 33,7mm, più del doppio del vero 1,5cm. Con la
// board ridisegnata il rapporto è ~4,04:1, molto più vicino al reale: qui sotto le
// misure sono state ri-campionate da zero sulla nuova immagine (dimensioni e proporzioni
// diverse dalla precedente).
//
// Scala reale: derivata dalla carta Classe (che va nello slot a sinistra), non dal dado —
// misurato lo slot carta sull'immagine (732x1107px) e forzato a 63,5mm di LARGHEZZA (formato
// Poker): usare l'altezza invece darebbe uno slot troppo STRETTO per la carta (non entra
// affatto), mentre scalando sulla larghezza il dado viene ~15,7mm (praticamente esatto) e lo
// slot carta resta solo un po' più alto del dovuto — difetto minore, la carta comunque ci
// sta. A questa scala la board viene ~217x144mm: non entra in un A4 verticale, ma un A4
// ORIZZONTALE sì (297x210mm) — 1 sola plancia a foglio (né 2 né 4: la board da sola supera
// già metà foglio in entrambe le versioni provate finora).
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
const W = 2506, H = 1664;

const STAT_ICON = { for: '💪', int: '🧠', des: '🏃', pv: '❤️', san: '🌀', anima: '🕯️' };
// posizione delle 6 caselle (misurate via campionamento colore su plancia_giocatore.png),
// griglia 2x3 nello stesso ordine di lettura dell'array STATS del gioco. topEdge = dove
// inizia l'ombra/bevel della casella (poco prima del colore pieno) — l'icona vi si appoggia
// da sopra.
const SLOTS = [
  { stat: 'for',   cx: 1387,   topEdge: 427 },
  { stat: 'int',   cx: 1709.5, topEdge: 427 },
  { stat: 'des',   cx: 2039,   topEdge: 427 },
  { stat: 'pv',    cx: 1387,   topEdge: 936 },
  { stat: 'san',   cx: 1709.5, topEdge: 936 },
  { stat: 'anima', cx: 2039,   topEdge: 936 },
];
const ICON_H = 45; // altezza icona in px nativi — la riga 1 ha ~176px liberi sopra, molto più della v1

// Scala reale: vedi commento in testa al file. Slot carta misurato 732px di larghezza,
// forzato a corrispondere a 63,5mm (formato Poker).
const CARD_SLOT_W_PX = 732;
const MM_PER_PX = 63.5 / CARD_SLOT_W_PX;
const BOARD_W_MM = W * MM_PER_PX;
const BOARD_H_MM = H * MM_PER_PX;

function frontHtml() {
  const imgUrl = pathToFileURL(SRC_IMG).href;
  const iconsHtml = SLOTS.map(s => `
    <div class="ic" style="left:${s.cx}px; bottom:${H - s.topEdge + 4}px;">${STAT_ICON[s.stat]}</div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8">
  <style>
    *{box-sizing:border-box; margin:0; padding:0;}
    body{ width:${W}px; height:${H}px; position:relative; background:#000; }
    .board{ position:absolute; inset:0; width:100%; height:100%; }
    .ic{
      position:absolute; transform:translateX(-50%); font-size:${ICON_H}px; line-height:1;
      filter:drop-shadow(0 1px 3px rgba(0,0,0,.4));
    }
  </style></head>
  <body>
    <img class="board" src="${imgUrl}">
    ${iconsHtml}
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

// Segnalini: due icone (freccia doppia su/giù) ritagliate da segnalini.jpg (2048x2048,
// sfondo nero) — stesso riquadro di ritaglio (670px) centrato su ciascuna, per una resa
// visiva coerente fra i due. Il cerchio-slot accanto ai dadi misura ~6mm di diametro alla
// scala della nuova board (era ~10,5mm nella v1, la board si è rimpicciolita insieme al
// dado): i segnalini vanno stampati a quella stessa dimensione.
const TOKEN_RENDER_PX = 500; // risoluzione del master, non la dimensione di stampa
const TOKEN_CROP = 670;
const TOKEN_MM = 6;
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

function printSheetHtml(imgFile) {
  const url = pathToFileURL(imgFile).href;
  const PAGE_W_MM = 297, PAGE_H_MM = 210, MARGIN_MM = 5; // A4 ORIZZONTALE: la board (~217x144mm) non entra in verticale
  const left = (PAGE_W_MM - BOARD_W_MM) / 2, top = (PAGE_H_MM - BOARD_H_MM) / 2;
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
  </style></head><body><div class="sheet">
    <div class="cell"><img src="${url}"><i class="crop tl"></i><i class="crop tr"></i><i class="crop bl"></i><i class="crop br"></i></div>
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
