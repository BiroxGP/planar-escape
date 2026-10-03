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
// cx = asse comune per colonna (822 / 998 / 1172): le caselle dado nell'immagine sono sfalsate di
// ~2px tra riga alta e bassa (misurato sui pixel della cornice colorata: 822.5/821.5, 999/997,
// 1172.5/1171), i quadrati pedina impilati sullo stesso asse no — altrimenti il "−" della riga
// alta e il "+" di quella bassa mostrano uno scalino.
const SLOTS = [
  { stat: 'for',   cx: 822,  topEdge: 314, bottomEdge: 428, row: 1 },
  { stat: 'int',   cx: 998,  topEdge: 314, bottomEdge: 428, row: 1 },
  { stat: 'des',   cx: 1172, topEdge: 314, bottomEdge: 428, row: 1 },
  { stat: 'pv',    cx: 822,  topEdge: 592, bottomEdge: 708, row: 2 },
  { stat: 'san',   cx: 998,  topEdge: 592, bottomEdge: 708, row: 2 },
  { stat: 'anima', cx: 1172, topEdge: 592, bottomEdge: 708, row: 2 },
];
const ICON_H = 27; // altezza icona in px nativi — dimensionata per restare ~4mm reali come nella v3
const LABEL_PX = 15; // font-size dell'etichetta sotto il dado — ~2,3mm reali come nella v3

// Scala reale: vedi commento in testa al file. Slot carta misurato ~424px di larghezza,
// forzato a corrispondere a 63,5mm (formato Poker).
const CARD_SLOT_W_PX = 424;
const MM_PER_PX = 63.5 / CARD_SLOT_W_PX;
// Alloggiamenti della pedina temporanea: un quadrato SOPRA ogni dado (bonus, +) e uno SOTTO
// (malus, −), da ritagliare con il cutter insieme alle caselle dado in un cartoncino
// sovrapposto. 10,5mm = pedina da 10mm più un po' di gioco. Tra la riga alta e la bassa non c'è
// spazio per icona e nome in mezzo: la riga 1 li ha sopra lo slot "+", la riga 2 sotto lo "−".
const TOKEN_SLOT_PX = Math.round(10.5 / MM_PER_PX);
const TOKEN_SLOT_GAP = 4;
const BOARD_W_MM = W * MM_PER_PX;
const BOARD_H_MM = H * MM_PER_PX;

function frontHtml() {
  const imgUrl = pathToFileURL(SRC_IMG).href;
  const iconTop = s => s.row === 1
    ? s.topEdge - TOKEN_SLOT_GAP - TOKEN_SLOT_PX - 4 - ICON_H
    : s.bottomEdge + TOKEN_SLOT_GAP + TOKEN_SLOT_PX + 4;
  const labelTop = s => s.row === 1 ? iconTop(s) - 20 : iconTop(s) + ICON_H + 4;
  const iconsHtml = SLOTS.map(s => `
    <div class="ic" style="left:${s.cx}px; top:${iconTop(s)}px;">${STAT_ICON[s.stat]}</div>`).join('');
  const labelsHtml = SLOTS.map(s => `
    <div class="lbl" style="left:${s.cx}px; top:${labelTop(s)}px;">${STAT_LABEL[s.stat]}</div>`).join('');
  const tokenSlotsHtml = SLOTS.map(s => {
    const upTop = s.topEdge - TOKEN_SLOT_GAP - TOKEN_SLOT_PX;
    const downTop = s.bottomEdge + TOKEN_SLOT_GAP;
    const box = (top, cls) => `<div class="tokslot ${cls}" style="left:${s.cx - TOKEN_SLOT_PX / 2}px; top:${top}px; width:${TOKEN_SLOT_PX}px; height:${TOKEN_SLOT_PX}px;"></div>`;
    return box(upTop, 'plus') + box(downTop, 'minus');
  }).join('');
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
    .tokslot{ position:absolute; border:2.5px solid #3b3128; border-radius:6px; background:rgba(255,255,255,.12); }
    /* solo il riquadro vuoto: niente segni +/− dentro (richiesta 03/10), la posizione sopra/sotto il dado basta */
    .lbl{
      position:absolute; transform:translateX(-50%);
      font-family:'JetBrains Mono',monospace; font-weight:700; font-size:${LABEL_PX}px;
      letter-spacing:.02em; text-transform:uppercase; color:#4a4136; white-space:nowrap;
      text-shadow:0 1px 0 rgba(255,255,255,.3);
    }
  </style></head>
  <body>
    <img class="board" src="${imgUrl}">
    ${tokenSlotsHtml}
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

// Segnalino di modificatore temporaneo: prima erano due icone (freccia doppia su/giù,
// cerchio 5mm) da posare nel cerchio-slot accanto a ogni dado — l'utente ha tolto quei
// cerchi-slot dalla board (v5 di plancia_giocatore.png, stesse dimensioni 1520x1034,
// stesso resto dell'immagine) e ha chiesto un solo segnalino invece di due: la freccia
// (sempre "su", ritagliata da segnalini.jpg) posata FISICAMENTE sopra al dado = bonus,
// sotto al dado = malus — la posizione porta il significato, non serve un secondo disegno
// con la freccia in giù. Forma quadrata (non più cerchio) per richiamare il dado/la
// casella che lo contiene sulla board, invece di un gettone rotondo scollegato dal resto.
const TOKEN_RENDER_PX = 500; // risoluzione del master, non la dimensione di stampa
const TOKEN_CROP = 670;
const TOKEN_MM = 10; // chip ben visibile appoggiato sopra/sotto al dado (~16mm), non un puntino
const TOKEN_ICON_CENTER = [637, 1006]; // stessa freccia "su" di segnalini.jpg — ricentrata: il vecchio [664.5,1026] andava bene per il ritaglio circolare di prima (il bordo tondo nascondeva lo sbilanciamento), ma nel chip quadrato pieno si vedeva la freccia spostata
// stile del chip: fondo scuro (necessario perché la freccia si compone con mix-blend-mode
// "screen", che funziona solo su base scura — su un fondo chiaro il nero non sparirebbe
// e i colori della freccia sbiadirebbero) più un bordo bronzo che richiama la cornice
// metallica della board, invece del beige della casella (che avrebbe rotto la sovrapposizione).
const TOKEN_BG = '#1f1b16';
const TOKEN_BORDER = '#a89a80';

function tokenHtml() {
  const bgSize = 2048 * (TOKEN_RENDER_PX / TOKEN_CROP);
  const bgPosX = -(TOKEN_ICON_CENTER[0] - TOKEN_CROP / 2) * (TOKEN_RENDER_PX / TOKEN_CROP);
  const bgPosY = -(TOKEN_ICON_CENTER[1] - TOKEN_CROP / 2) * (TOKEN_RENDER_PX / TOKEN_CROP);
  const url = pathToFileURL(SRC_TOKENS).href;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;}
    body{ background:transparent; }
    .token{
      position:relative; width:${TOKEN_RENDER_PX}px; height:${TOKEN_RENDER_PX}px;
      border-radius:${Math.round(TOKEN_RENDER_PX * .12)}px; overflow:hidden;
      background:${TOKEN_BG}; box-shadow:inset 0 0 0 ${Math.round(TOKEN_RENDER_PX*.03)}px ${TOKEN_BORDER};
    }
    .icon{
      position:absolute; inset:0; background-repeat:no-repeat;
      background-image:url(${url});
      background-size:${bgSize}px ${bgSize}px; background-position:${bgPosX}px ${bgPosY}px;
      /* segnalini.jpg ha sfondo nero: screen lo fa sparire sul chip chiaro (nero=trasparente
         con screen), lasciando solo il bagliore della freccia — stesso trucco già usato per
         i sigilli di scuola/categoria su sfondo colorato in template.js. */
      mix-blend-mode:screen;
    }
  </style></head><body><div class="token" id="token"><div class="icon"></div></div></body></html>`;
}

// Retro del segnalino: stesso chip scuro con bordo bronzo del fronte (per restare
// riconoscibile come lo stesso oggetto), ma senza la freccia — un semplice "±" a incidere
// il bagliore ambra, giusto per dire "sei un modificatore" quando è ancora a faccia in giù,
// niente di più (è un gettone che sta quasi sempre a faccia in su una volta piazzato).
function tokenBackHtml() {
  return `<!doctype html><html><head><meta charset="utf-8">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap">
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{ background:transparent; }
    .token{
      position:relative; width:${TOKEN_RENDER_PX}px; height:${TOKEN_RENDER_PX}px;
      border-radius:${Math.round(TOKEN_RENDER_PX * .12)}px; overflow:hidden;
      background:${TOKEN_BG}; box-shadow:inset 0 0 0 ${Math.round(TOKEN_RENDER_PX*.03)}px ${TOKEN_BORDER};
      display:flex; align-items:center; justify-content:center;
    }
    .sym{
      font-family:'Cinzel','GFS Baskerville','Liberation Serif',serif; font-weight:700;
      font-size:${Math.round(TOKEN_RENDER_PX * .5)}px; line-height:1; color:#f4e2b8;
      text-shadow:0 0 ${Math.round(TOKEN_RENDER_PX*.06)}px #d9a94a, 0 0 ${Math.round(TOKEN_RENDER_PX*.14)}px #d9a94a;
    }
  </style></head><body><div class="token"><div class="sym">±</div></div></body></html>`;
}

function tokenSheetHtml(tokenFile, count, mirror) {
  const url = pathToFileURL(tokenFile).href;
  const PAGE_W_MM = 210, PAGE_H_MM = 297, MARGIN_MM = 12, GAP_MM = 4;
  const cols = Math.floor((PAGE_W_MM - 2 * MARGIN_MM + GAP_MM) / (TOKEN_MM + GAP_MM));
  const cells = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    // il foglio dei retri va stampato sul retro dello STESSO foglio dei fronti, girando il
    // foglio A4 da sinistra a destra (come si volta una pagina) — stessa colonna specchiata
    // usata da print-pnp.js per le carte, altrimenti fronte e retro di ogni pedina non
    // cadono nello stesso punto fisico e il taglio non torna.
    cells.push({ col: mirror ? cols - 1 - col : col, row });
  }
  const cellsHtml = cells.map(c => `
    <div class="tok" style="left:${MARGIN_MM + c.col * (TOKEN_MM + GAP_MM)}mm; top:${MARGIN_MM + c.row * (TOKEN_MM + GAP_MM)}mm;">
      <img src="${url}">
    </div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{ background:#fff; }
    .sheet{ position:relative; width:${PAGE_W_MM}mm; height:${PAGE_H_MM}mm; }
    .tok{ position:absolute; width:${TOKEN_MM}mm; height:${TOKEN_MM}mm; box-shadow:0 0 0 .15mm #999; }
    .tok img{ display:block; width:100%; height:100%; }
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
  // /opt/pw-browsers = sessione cloud; in locale (Windows) usa il Chromium di Playwright
  const exe = process.env.PW_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});

  const frontPngPath = path.join(OUT_DIR, 'plancia_giocatore_fronte.png');
  const backPngPath = path.join(OUT_DIR, 'plancia_giocatore_retro.png');
  await renderHtmlToFile(browser, frontHtml(), frontPngPath, { width: W, height: H });
  await renderHtmlToFile(browser, backHtml(), backPngPath, { width: W, height: H });

  const tokenPngPath = path.join(OUT_DIR, 'segnalino_modificatore.png');
  await renderHtmlToFile(browser, tokenHtml(), tokenPngPath, { width: TOKEN_RENDER_PX, height: TOKEN_RENDER_PX });
  const tokenBackPngPath = path.join(OUT_DIR, 'segnalino_modificatore_retro.png');
  await renderHtmlToFile(browser, tokenBackHtml(), tokenBackPngPath, { width: TOKEN_RENDER_PX, height: TOKEN_RENDER_PX });

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
  // fronte e retro dei segnalini sono tutti identici fra loro (non ci sono coppie uniche
  // come nelle carte), ma la griglia va comunque specchiata sul retro: si stampa sullo
  // stesso foglio già stampato coi fronti, girandolo — senza specchiare, la colonna N del
  // fronte non cade più sopra alla colonna N del retro una volta girato il foglio.
  await pdf(tokenSheetHtml(tokenPngPath, 30, false), path.join(PRINT_DIR, 'segnalini_fronte.pdf'), 210, 297);
  await pdf(tokenSheetHtml(tokenBackPngPath, 30, true), path.join(PRINT_DIR, 'segnalini_retro.pdf'), 210, 297);

  await browser.close();
  console.log('Fatto: plancia_giocatore_fronte.png / _retro.png / segnalino_modificatore.png / _retro.png in ' + OUT_DIR);
  console.log(`Fatto: plancia_fronte.pdf / plancia_retro.pdf (1 per foglio A4 orizzontale, ${BOARD_W_MM.toFixed(1)}x${BOARD_H_MM.toFixed(1)}mm) + segnalini_fronte.pdf / _retro.pdf (30 pedine quadrate, ${TOKEN_MM}mm ciascuna — sopra al dado = bonus, sotto = malus) in ${PRINT_DIR}`);
}

main().catch(err => { console.error(err); process.exit(1); });
