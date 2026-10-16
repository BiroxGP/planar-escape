// Tabellone da tavolo a 4 FOGLI A4 verticali uniti 2x2 (equivalente A2, 406x580mm montato).
//   META' ALTA  (y 0..290)   : i 7 mazzi Incontro (Poker 63,5x88) disposti per poli, il Mazzo Piani (Tarocco 120x70) a sinistra
//   META' BASSA (y 290..580) : Piano corrente (Tarocco) e Incontro attivo (Poker) vicini al centro in alto, le due catene
//                              oscure, 4 cluster stellari (36 nodi da 18mm per il segnalino) e la scaletta dei piani pescati
// Posizionamento per poli: Armonia (ordine) e Entropia (caos) agli estremi opposti, Elementare e Eterei ai due lati del
// centro, Generico al centro, Demoniaco e Non-morti insieme sul lato di Entropia (opposti ad Armonia).
// Gli sfondi (assets/ui/tabellone_a2_alto.jpg / _basso.jpg) sono dell'utente, scalati a 406x290mm.
//
// GIUNZIONI: fogli sovrapposti di 14mm (sinistri x 0..210, destri 196..406; alti y 0..297, bassi 283..580); si ritaglia
// lungo le linee tratteggiate (x=203, y=290). Nessuna zona-carta attraversa y=290; il Generico (centro in alto) sta a
// cavallo di x=203, tutto il resto no (a parte qualche nodo/tacca, che tollera 1-2mm).
//
// Uso: node render-tabellone-a2.js          -> cards_final/print/tabellone_A2_4fogli.pdf (4 pagine) + anteprima
//      node render-tabellone-a2.js prova    -> solo l'anteprima PNG del tabellone montato (cards_final/altro/tabellone_A2_prova.png)
//      node render-tabellone-a2.js misure   -> verifica dimensioni e distanze
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
// pdfunite (poppler) serve per unire i 4 fogli: Chrome rimpicciolisce il documento se piu' fogli hanno contenuto spostato
// fuori pagina, quindi ogni foglio si stampa da solo e poi si uniscono. Percorso sovrascrivibile con PDFUNITE.
const PDFUNITE = process.env.PDFUNITE || 'pdfunite';
const { convertAll } = require('./png-to-jpg-cache.js');

const UI = path.join(__dirname, '..', 'assets', 'ui');
const RETRO = path.join(__dirname, '..', 'cards_final', 'retro');
const JPG_CACHE = path.join(__dirname, '..', 'cards_final', 'print', '_jpgcache');
const OUT_PRINT = path.join(__dirname, '..', 'cards_final', 'print');
const OUT_ALTRO = path.join(__dirname, '..', 'cards_final', 'altro');
// sfondo UNICO dell'utente (1728x2464 = 7:10): una sola immagine, una sola cornice (le due meta' precedenti sono archiviate come v1/alto/basso)
const BG_UNICO = path.join(UI, 'tabellone_unico.jpg');

const BW = 406, BH = 580, HALF = 290;
const SEAM_X = 203, SEAM_Y = 290;
const SHEET_DX = 196, SHEET_DY = 283;
const P = { w: 63.5, h: 88 }, T = { w: 120, h: 70 };
const NODE_D = 18;
// MARGINE FISICO: una stampante A4 non stampa i primi 5-7mm del foglio. I fogli esterni (x=0 / x=406, y=0 / y=580) hanno
// la cornice dello sfondo proprio sul bordo: per non perderla si rimpicciolisce SOLO lo sfondo (non le carte, che restano a
// misura reale) verso il centro, lasciando 7mm di margine attorno; le zone-carta e i nodi restano dove sono.
const PRINT_MARGIN = 7;
const BG_SCALE = (BW - 2 * PRINT_MARGIN) / BW;      // 0,9655
const MAPPA = path.join(__dirname, '..', 'cards_final', 'print', '_mappa');   // medaglie e nebulose pronte (node prep-mappa.js)
const NEB_SIZE = { elementare: 124, eterei: 124, armonia: 124, entropia: 128, demoniaco: 112, nonmorti: 112 };   // mm, lato dell'immagine quadrata

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">`;

// colori di famiglia (gioco.html .fam-*), schiariti per leggerli su fondo scuro
const FAM = {
  elementare: { c: '#c1531f', n: 'ELEMENTARE' }, eterei: { c: '#3a5aa8', n: 'ETEREI' }, armonia: { c: '#b89323', n: 'ARMONIA' },
  entropia: { c: '#5f3f92', n: 'ENTROPIA' }, demoniaco: { c: '#8f1f1f', n: 'DEMONIACO' }, nonmorti: { c: '#3d5c40', n: 'NON-MORTI' },
};
function light(hex, k) { const n = parseInt(hex.slice(1), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; const m = v => Math.round(v + (255 - v) * k); return `rgb(${m(r)},${m(g)},${m(b)})`; }
function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }

// ---------- META' ALTA -------------------------------------------------------------------------------
const ROW1 = 82, ROW2 = 186;                    // file di mazzi Poker: 82..170 e 186..274 (sotto le candele agli angoli dello sfondo, che con la riduzione per il margine fisico arrivano a y~76)
const COLX = [60, 131.5, 203, 274.5, 346];      // centri delle 5 colonne (pitch 71,5; la centrale e' sulla giunzione)
const zx = i => COLX[i] - P.w / 2;
const DECKS = [
  { n: 'ARMONIA', col: FAM.armonia.c, x: zx(0), y: ROW1, retro: ['retro_incontro_armonia'] },
  { n: 'ELEMENTARE', col: FAM.elementare.c, x: zx(1), y: ROW1, retro: ['retro_incontro_elementare'] },
  { n: 'GENERICO', col: '#aeb4c0', x: zx(2), y: ROW1, retro: ['retro_incontro_generico'] },
  { n: 'ETEREI', col: FAM.eterei.c, x: zx(3), y: ROW1, retro: ['retro_incontro_eterei'] },
  { n: 'ENTROPIA', col: FAM.entropia.c, x: zx(4), y: ROW1, retro: ['retro_incontro_entropia'] },
  { n: 'NON-MORTI', col: FAM.nonmorti.c, x: zx(3), y: ROW2, retro: ['retro_incontro_nonmorti'] },
  { n: 'MAZZO EPICO', col: '#e7c988', x: zx(2), y: ROW2, retro: ['retro_incontro_epico'] },
  { n: 'DEMONIACO', col: FAM.demoniaco.c, x: zx(4), y: ROW2, retro: ['retro_incontro_demoni'] },
  // il Mazzo Piani da solo a sinistra, separato dai mazzi Incontro (Tarocco, centrato verticalmente nella fila)
  { n: 'MAZZO PIANI', col: '#c9a15a', x: 28, y: ROW2 + (P.h - T.h) / 2, w: T.w, h: T.h, retro: ['retro_piani'] },
].map(d => ({ ...P, ...d }));

// ---------- META' BASSA -------------------------------------------------------------------------------
const Y0 = HALF;
// Piano corrente e Incontro attivo: vicini, ai due lati della giunzione (il taglio cade fra i due)
const ACTIVE = [
  { n: 'PIANO CORRENTE', sub: 'Il piano in corso:<br>effetto subito.', col: '#c9a15a', x: 76, y: Y0 + 31, ...T },
  { n: 'INCONTRO ATTIVO', sub: 'La carta del turno.<br>Ogni 5 piani (come il livello):<br>mazzo Generico.<br>Famiglia completata o nuovo<br>giro: mazzo Epico (vince).', col: '#aeb4c0', x: 210, y: Y0 + 22, ...P },
];
// cluster: origine (x,y) = angolo in alto a sinistra dell'area, larghezza 76; punti relativi all'angolo
const CW = 76, CY = Y0 + 110;
const G3 = [12.5, 38, 63.5];
const CLUSTERS = [
  { fam: 'armonia', ox: 28, oy: CY, w: CW, pts: [[G3[0], 29], [G3[1], 26], [G3[2], 30], [G3[0], 63], [G3[1], 61], [G3[2], 65], [G3[0], 97], [G3[1], 95], [G3[2], 98]],
    links: [[0, 1], [1, 2], [3, 4], [4, 5], [6, 7], [7, 8], [0, 3], [3, 6], [1, 4], [4, 7], [2, 5], [5, 8]] },
  { fam: 'elementare', ox: 114, oy: CY, w: CW, pts: [[25, 28], [51, 26], [G3[0], 62], [G3[1], 61], [G3[2], 63], [25, 96], [51, 97]],
    links: [[0, 1], [0, 2], [0, 3], [1, 3], [1, 4], [2, 3], [3, 4], [2, 5], [3, 5], [3, 6], [4, 6], [5, 6]] },
  { fam: 'eterei', ox: 216, oy: CY, w: CW, pts: [[G3[0], 30], [G3[2], 27], [G3[1], 62], [G3[0], 96], [G3[2], 94]],
    links: [[0, 2], [1, 2], [2, 3], [2, 4], [0, 1], [3, 4]] },
  { fam: 'entropia', ox: 304, oy: CY, w: CW, pts: [[G3[0], 27], [G3[1], 30], [G3[2], 26], [G3[0], 62], [G3[1], 64], [G3[2], 61], [G3[0], 97], [G3[1], 94], [G3[2], 98]],
    links: [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5], [3, 6], [4, 7], [5, 8], [6, 7], [7, 8]] },
  // le due catene oscure, insieme sul lato di Entropia (tre gironi / tre livelli)
  { fam: 'nonmorti', ox: 290, oy: Y0 + 20, w: 40, pts: [[20, 28], [20, 55], [20, 82]], links: [[0, 1], [1, 2]] },
  { fam: 'demoniaco', ox: 334, oy: Y0 + 20, w: 40, pts: [[20, 28], [20, 55], [20, 82]], links: [[0, 1], [1, 2]] },
];
const SHORT = { 'Le Porte di Brace': 'Porte di Brace', 'Il Baratro in Fiamme': 'Baratro in Fiamme', "Il Gelo dell'Abisso": "Gelo dell'Abisso", 'La Palude Sconsacrata': 'Palude Sconsacrata', 'Il Velo dei Sussurri': 'Velo dei Sussurri', 'La Voragine della Negatività': 'Voragine' };
const PIANI = JSON.parse(fs.readFileSync(path.join(__dirname, 'piani-data.json'), 'utf8'));
const planeNames = fam => PIANI.filter(p => p.family === fam).map(p => { const n = p.name.replace(/ \(.*\)$/, ''); return SHORT[n] || n; });
const nodeAbs = cl => cl.pts.map(([x, y]) => [cl.ox + x, cl.oy + y]);

// scaletta dei piani pescati: 20 tacche; avanzamento di livello a 5/10/15 (3 livelli, come nel gioco)
const LADDER_N = 15, LADDER_PITCH = 22, LADDER_Y = Y0 + 245, LADDER_D = 14;     // passo 16mm: la tacca 1 e la 20 restano fuori dai nodi d'angolo della cornice
const LEVEL_AT = { 5: 'LIV. 2', 10: 'LIV. 3', 15: 'LIV. 4' };
const ladderX = i => SEAM_X + (i - (LADDER_N - 1) / 2 - 0.5) * LADDER_PITCH;      // il taglio cade fra la tacca 8 e la 9

// ---------- HTML ------------------------------------------------------------------------------------
const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  .board{ position:absolute; width:${BW}mm; height:${BH}mm; left:0; top:0; }
  .bg{ position:absolute; left:0; width:${BW}mm; display:block; }
  .fr{ position:absolute; border-radius:3mm; }
  .cd{ position:absolute; overflow:hidden; border-radius:2.4mm; }
  .cd img{ position:absolute; left:0; top:0; width:100%; height:100%; object-fit:cover; display:block; }
  .tx{ position:absolute; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; color:#e9dcc0; padding:0 3mm; }
  .tn{ font-family:'Cinzel',serif; font-weight:700; font-size:4.4mm; letter-spacing:.07em; white-space:nowrap; text-shadow:0 .3mm 1mm rgba(0,0,0,.95), 0 0 2mm rgba(0,0,0,.8); }
  .ts{ margin-top:2mm; font-family:'Source Serif 4',serif; font-style:italic; font-size:3mm; line-height:1.3; color:#d8ccaa; text-shadow:0 .3mm .8mm rgba(0,0,0,.95), 0 0 2mm rgba(0,0,0,.8); }
  .neb{ position:absolute; mix-blend-mode:screen; opacity:.9; display:block; }
  .nd{ position:absolute; border-radius:50%; }
  .nl{ position:absolute; text-align:center; font-family:'Source Serif 4',serif; font-size:2.5mm; line-height:1.1; color:#f1e7cc; text-shadow:0 0 1mm #000, 0 0 .6mm #000; width:24mm; }
  .ct{ position:absolute; text-align:center; font-family:'Cinzel',serif; font-weight:700; font-size:3.7mm; letter-spacing:.12em; text-shadow:0 0 1mm #000, 0 0 2mm #000, 0 0 3.5mm #000; }
  .tk{ position:absolute; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'JetBrains Mono',monospace; font-weight:700; font-size:3.3mm; color:#d9cfae; background:rgba(5,7,18,.6); }
  .tl{ position:absolute; text-align:center; font-family:'JetBrains Mono',monospace; font-weight:700; font-size:2.4mm; letter-spacing:.05em; color:#f1d9a0; width:16mm; text-shadow:0 0 1mm #000; }
`;
const outline = (z, col) => `<div class="fr" style="left:${z.x - 1}mm; top:${z.y - 1}mm; width:${z.w + 2}mm; height:${z.h + 2}mm; border:.7mm solid ${col}; box-shadow:0 0 2.4mm ${rgba(col, .65)}, inset 0 0 1.6mm ${rgba(col, .25)};"></div>`;

function deckHtml(s) {
  return outline(s, s.col) + `<div class="cd" style="left:${s.x}mm; top:${s.y}mm; width:${s.w}mm; height:${s.h}mm;"><img src="${pathToFileURL(path.join(JPG_CACHE, s.retro[0] + '.jpg')).href}"></div>`;
}
function activeHtml(s) {   // solo cornice luminosa e testo: nessun riempimento rettangolare
  return outline(s, s.col) + `<div class="tx" style="left:${s.x}mm; top:${s.y}mm; width:${s.w}mm; height:${s.h}mm;"><div class="tn">${s.n}</div><div class="ts">${s.sub}</div></div>`;
}
function starHtml() {
  let neb = '', html = '', svg = '';
  for (const cl of CLUSTERS) {
    const f = FAM[cl.fam], col = light(f.c, 0.5), names = planeNames(cl.fam), abs = nodeAbs(cl);
    // nebulosa di famiglia dietro al cluster: immagine dell'utente su nero, in modo 'screen' (il nero sparisce)
    const xs = abs.map(p => p[0]), ys = abs.map(p => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2, ns = NEB_SIZE[cl.fam];
    neb += `<img class="neb" src="${pathToFileURL(path.join(MAPPA, 'nebulosa_' + cl.fam + '.jpg')).href}" style="left:${cx - ns / 2}mm; top:${cy - ns / 2}mm; width:${ns}mm; height:${ns}mm;">`;
    cl.links.forEach(([a, b]) => { svg += `<line x1="${abs[a][0]}" y1="${abs[a][1]}" x2="${abs[b][0]}" y2="${abs[b][1]}" stroke="${col}" stroke-opacity=".7" stroke-width=".6" stroke-linecap="round"/>`; });
    html += `<div class="ct" style="left:${cl.ox}mm; top:${Math.min(...ys) - NODE_D / 2 - 7}mm; width:${cl.w}mm; color:${col};">${f.n}</div>`;
    abs.forEach(([x, y], i) => {
      const medal = pathToFileURL(path.join(MAPPA, cl.fam + '_' + i + '.jpg')).href;
      html += `<div class="nd" style="left:${x - NODE_D / 2}mm; top:${y - NODE_D / 2}mm; width:${NODE_D}mm; height:${NODE_D}mm; background:#05070f url(${medal}) center/cover; box-shadow:0 0 2.4mm ${rgba(f.c, .8)}, 0 0 .6mm #000;"></div>
        <div class="nl" style="left:${x - 12}mm; top:${y + NODE_D / 2 + .8}mm;">${names[i] || ''}</div>`;
    });
  }
  return neb + `<svg style="position:absolute; left:0; top:0; width:${BW}mm; height:${BH}mm; overflow:visible" viewBox="0 0 ${BW} ${BH}">${svg}</svg>` + html;
}
function ladderHtml() {
  let h = `<div class="ts" style="position:absolute; left:26mm; top:${LADDER_Y - 21}mm; width:340mm; text-align:left; font-size:2.8mm; margin:0; line-height:1.35;">PIANI PESCATI · ogni 5: livello e mazzo Generico · alla 15 (livello massimo) si riparte dalla 1, e il primo piano di ogni nuovo giro è Epico<br>PEDINE · si mette una pedina sul nodo solo quando il piano viene visitato o murato (Via murata) · se esce un piano con il nodo già occupato è murato: si scarta · famiglia completata = tutti i suoi nodi occupati</div>`;
  for (let i = 0; i < LADDER_N; i++) {
    const n = i + 1, x = ladderX(i), lv = LEVEL_AT[n];
    const d = lv ? LADDER_D + 3 : LADDER_D, col = lv ? '#e7c988' : 'rgba(217,207,174,.65)';
    h += `<div class="tk" style="left:${x - d / 2}mm; top:${LADDER_Y - d / 2}mm; width:${d}mm; height:${d}mm; border:${lv ? '.9mm' : '.5mm'} solid ${col}; ${lv ? 'box-shadow:0 0 2mm #e7c98899; color:#f1d9a0;' : ''}">${n}</div>`;
    if (n === 1) h += `<div class="tl" style="left:${x + 10}mm; top:${LADDER_Y + d / 2 + 1}mm; width:44mm; text-align:left;">◂ DAL 2° GIRO: EPICO</div>`;
    if (lv) h += `<div class="tl" style="left:${x - 8}mm; top:${LADDER_Y + d / 2 + 1}mm;">${lv}</div>`;
  }
  return h;
}

function boardHtml() {
  const bgs = `<img class="bg" style="top:0; height:${BH}mm" src="${pathToFileURL(BG_UNICO).href}">`;
  const wrap = `<div style="position:absolute; left:0; top:0; width:${BW}mm; height:${BH}mm; transform-origin:${SEAM_X}mm ${SEAM_Y}mm; transform:scale(${BG_SCALE});">${bgs}</div>`;
  return wrap + DECKS.map(deckHtml).join('') + ACTIVE.map(activeHtml).join('') + starHtml() + ladderHtml();
}

function sheetHtml(col, row, label) {
  const sx = col === 0 ? 0 : -SHEET_DX, sy = row === 0 ? 0 : -SHEET_DY;
  const cutX = col === 0 ? SEAM_X : SEAM_X - SHEET_DX;
  const cutY = row === 0 ? SEAM_Y : SEAM_Y - SHEET_DY;
  const dash = 'repeating-linear-gradient(%DIR%, rgba(235,235,235,.85) 0 1.2mm, transparent 1.2mm 2.4mm)';
  const cuts = `<div style="position:absolute; left:${cutX - .15}mm; top:0; width:.3mm; height:297mm; background:${dash.replace('%DIR%', '180deg')};"></div>
    <div style="position:absolute; top:${cutY - .15}mm; left:0; height:.3mm; width:210mm; background:${dash.replace('%DIR%', '90deg')};"></div>`;
  const rulY = row === 0 ? 285 : 9;     // dentro il navy centrale (mai sopra la cornice)
  const rul = `<div style="position:absolute; left:24mm; top:${rulY}mm; width:40mm;"><div style="height:.3mm; background:#ddd;"></div>${[0, 1, 2, 3, 4].map(m => `<i style="position:absolute; left:${m * 10 - .15}mm; top:-1mm; width:.3mm; height:2.3mm; background:#ddd;"></i>`).join('')}<div style="margin-top:.8mm; font:2.2mm sans-serif; color:#cfcfcf; width:100mm;">${label} · righello 40mm: se non misura 40mm stampa al 100%</div></div>`;
  return `<div class="sheet"><div class="board" style="left:${sx}mm; top:${sy}mm;">${boardHtml()}</div>${cuts}${rul}</div>`;
}
function docHtml(sheets) {
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
    @page{ size:210mm 297mm; margin:0; }
    html,body{ width:210mm; margin:0; padding:0; background:#0a0d1c; overflow-x:hidden; }
    body{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .sheet{ position:relative; width:210mm; height:297mm; overflow:hidden; background:#0a0d1c; page-break-after:always; }
    .sheet:last-child{ page-break-after:auto; }
    ${CSS}
  </style></head><body>${sheets.join('')}</body></html>`;
}

function misure() {
  let ok = true;
  console.log('Zone-carta (mm sul tabellone montato 406x580):');
  const zones = [...DECKS.map(d => ({ n: d.n, x: d.x, y: d.y, w: d.w, h: d.h })), ...ACTIVE.map(a => ({ n: a.n, x: a.x, y: a.y, w: a.w, h: a.h }))];
  for (const z of zones) {
    const x1 = z.x + z.w, y1 = z.y + z.h;
    const crossY = z.y < SEAM_Y && y1 > SEAM_Y, crossX = z.x < 210 && x1 > 196;     // 196..210 = fascia di sovrapposizione
    const inFrame = z.x >= 24 && x1 <= 382 && z.y >= (z.y < SEAM_Y ? 25 : SEAM_Y + 25) && y1 <= (z.y < SEAM_Y ? 266 : SEAM_Y + 266);
    if (crossY || !inFrame) ok = false;
    console.log(z.n.padEnd(16), `${z.w}x${z.h}`.padEnd(10), `x ${z.x.toFixed(1)}..${x1.toFixed(1)}  y ${z.y}..${y1}`.padEnd(30), crossY ? 'ATTRAVERSA y=290! ' : '', crossX ? '(tocca la fascia di giunzione x 196..210)' : '', inFrame ? '' : ' FUORI DALLA CORNICE?');
  }
  const all = [];
  for (const cl of CLUSTERS) nodeAbs(cl).forEach(([x, y], i) => all.push({ fam: cl.fam, i, x, y }));
  let minD = 1e9, pair = '';
  for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) {
    const dx = all[a].x - all[b].x, dy = all[a].y - all[b].y, d = Math.hypot(dx, dy);
    if (Math.abs(dx) < 15 && Math.abs(dy) < 24.5 && dy !== 0) { ok = false; console.log('ETICHETTA SOVRAPPOSTA', all[a].fam, all[a].i, all[b].fam, all[b].i, dx.toFixed(1), dy.toFixed(1)); }
    if (d < minD) { minD = d; pair = `${all[a].fam}#${all[a].i} - ${all[b].fam}#${all[b].i}`; }
  }
  console.log(`Nodi: ${all.length} (attesi 36); distanza minima fra centri ${minD.toFixed(1)}mm (${pair}) => spazio fra nodi ${(minD - NODE_D).toFixed(1)}mm`);
  if (all.length !== 36) ok = false;
  const onSeam = all.filter(n => Math.abs(n.x - SEAM_X) < NODE_D / 2 + 1).length;
  console.log(`Nodi sulla giunzione x=203: ${onSeam}; scaletta: taglio fra tacca 8 (${ladderX(7).toFixed(1)}) e 9 (${ladderX(8).toFixed(1)})`);
  console.log(ok ? 'OK' : 'ATTENZIONE: controlla gli avvisi sopra');
}

async function main() {
  const prova = process.argv.includes('prova');
  if (process.argv.includes('misure')) return misure();
  fs.mkdirSync(OUT_PRINT, { recursive: true });
  fs.mkdirSync(OUT_ALTRO, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
  if (!fs.existsSync(path.join(MAPPA, 'armonia_8.jpg')) || !fs.existsSync(path.join(MAPPA, 'nebulosa_nonmorti.jpg'))) execFileSync(process.execPath, [path.join(__dirname, 'prep-mappa.js')], { stdio: 'inherit' });
  const ids = [...new Set(DECKS.flatMap(d => d.retro))];
  await convertAll(ids.map(id => ({ id, srcDir: RETRO, outDir: JPG_CACHE })));
  if (!prova) {
    const labels = ['1/4 alto-sinistra', '2/4 alto-destra', '3/4 basso-sinistra', '4/4 basso-destra'];
    const parts = [];
    for (const [i, [c, r]] of [[0, 0], [1, 0], [0, 1], [1, 1]].entries()) {
      const tmp = path.join(__dirname, '_tmp-a2-' + i + '-' + Date.now() + '.html');
      fs.writeFileSync(tmp, docHtml([sheetHtml(c, r, labels[i])]));
      const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
      await page.goto(pathToFileURL(tmp).href);
      await page.waitForTimeout(3000);
      const part = path.join(OUT_PRINT, `_a2_${i + 1}.pdf`);
      await page.pdf({ path: part, printBackground: true, preferCSSPageSize: true });
      parts.push(part);
      await page.close(); fs.unlinkSync(tmp);
    }
    execFileSync(PDFUNITE, [...parts, path.join(OUT_PRINT, 'tabellone_A2_4fogli.pdf')]);
    parts.forEach(p => fs.unlinkSync(p));
  }
  // anteprima del tabellone montato
  const k = 96 / 25.4;
  const both = path.join(__dirname, '_tmp-a2-both-' + Date.now() + '.html');
  fs.writeFileSync(both, `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>html,body{background:#0a0d1c} .w{position:relative;width:${BW * k}px;height:${BH * k}px;overflow:hidden} ${CSS}</style></head><body><div class="w"><div class="board">${boardHtml()}</div></div></body></html>`);
  const pg = await browser.newPage({ viewport: { width: Math.round(BW * k), height: Math.round(BH * k) }, deviceScaleFactor: 1.4 });
  await pg.goto(pathToFileURL(both).href); await pg.waitForTimeout(3500);
  await pg.screenshot({ path: path.join(OUT_ALTRO, prova ? 'tabellone_A2_prova.png' : 'tabellone_A2_anteprima.png') });
  await pg.close(); fs.unlinkSync(both);
  await browser.close();
  console.log(prova ? 'Fatto: anteprima di prova' : 'Fatto: tabellone_A2_4fogli.pdf (4 pagine) + anteprima');
}
main().catch(e => { console.error(e); process.exit(1); });
