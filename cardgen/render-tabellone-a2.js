// Tabellone da tavolo a 4 FOGLI A4 verticali uniti 2x2 (equivalente A2, 406x580mm montato):
//   META' ALTA  (y 0..290)   : le 9 zone-mazzo (7 Incontri + Oggetti + Spell), carte Poker 63,5x88mm, coi dorsi veri
//   META' BASSA (y 290..580) : Piano attivo (Tarocco 120x70), Incontro attivo (Poker), mappa stellare dei 36 piani
//                              (cluster per famiglia, nodo da 18mm con spazio per il segnalino) e scaletta dei piani pescati
// Gli sfondi (assets/ui/tabellone_a2_alto.jpg / _basso.jpg, 2528x1696) sono dell'utente: vengono scalati a 406x290mm
// (il 2528x1696 ha rapporto 1,49, la meta' 1,40: stiramento verticale del 6,5%, per tenere intera la cornice).
//
// GIUNZIONI: i fogli si sovrappongono di 14mm in orizzontale e in verticale: sinistri x 0..210, destri x 196..406;
// alti y 0..297, bassi y 283..580. Si ritaglia lungo le linee tratteggiate (x=203 e y=290 del tabellone), il bordo
// bianco della stampante (fino a 7mm) cade nella parte di sovrapposizione. Nessuna zona-carta attraversa y=290;
// solo il mazzo Generico (centro in alto) e alcuni nodi/tacche stanno a cavallo di x=203.
//
// Uso: node render-tabellone-a2.js          -> cards_final/print/tabellone_A2_4fogli.pdf (4 pagine) + anteprima
//      node render-tabellone-a2.js misure   -> verifica dimensioni, distanze fra nodi e giunzioni
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
// pdfunite (poppler) serve per unire i 4 fogli: Chrome rimpicciolisce l'intero documento se piu' fogli hanno contenuto
// spostato fuori dalla pagina, quindi ogni foglio si stampa da solo e poi si uniscono. Percorso sovrascrivibile con PDFUNITE.
const PDFUNITE = process.env.PDFUNITE || 'pdfunite';

const UI = path.join(__dirname, '..', 'assets', 'ui');
const RETRO = path.join(__dirname, '..', 'cards_final', 'retro');
const OUT_PRINT = path.join(__dirname, '..', 'cards_final', 'print');
const OUT_ALTRO = path.join(__dirname, '..', 'cards_final', 'altro');
const { convertAll } = require('./png-to-jpg-cache.js');
const JPG_CACHE = path.join(__dirname, '..', 'cards_final', 'print', '_jpgcache');
const BG_TOP = path.join(UI, 'tabellone_a2_alto.jpg');
const BG_BOT = path.join(UI, 'tabellone_a2_basso.jpg');

const BW = 406, BH = 580, HALF = 290;          // tabellone montato e meta'
const SEAM_X = 203, SEAM_Y = 290;               // linee di taglio
const SHEET_DX = 196, SHEET_DY = 283;           // origine dei fogli destro/basso
const P = { w: 63.5, h: 88 }, T = { w: 120, h: 70 };
const NODE_D = 18;                              // diametro del nodo (segnalino ~15mm)

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">`;

// colori di famiglia (stessi del gioco, gioco.html .fam-*), schiariti per leggerli su fondo scuro
const FAM = {
  elementare: { c: '#c1531f', n: 'ELEMENTARE' }, eterei: { c: '#3a5aa8', n: 'ETEREI' }, armonia: { c: '#b89323', n: 'ARMONIA' },
  entropia: { c: '#5f3f92', n: 'ENTROPIA' }, demoniaco: { c: '#8f1f1f', n: 'DEMONIACO' }, nonmorti: { c: '#3d5c40', n: 'NON-MORTI' },
};
function light(hex, k) { const n = parseInt(hex.slice(1), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; const m = v => Math.round(v + (255 - v) * k); return `rgb(${m(r)},${m(g)},${m(b)})`; }

// ---------- META' ALTA: 9 zone-mazzo -----------------------------------------------------------
const ROW1 = 54, ROW2 = 160;                    // y delle due file (carte da 88mm: 54..142 e 160..248)
const COLX = [60, 131.5, 203, 274.5, 346];      // centri delle 5 colonne (pitch 71,5; la centrale e' sulla giunzione)
const zx = i => COLX[i] - P.w / 2;
const DECKS = [
  { n: 'ELEMENTARE', col: FAM.elementare.c, x: zx(0), y: ROW1, retro: ['retro_incontro_elementare'] },
  { n: 'ETEREI', col: FAM.eterei.c, x: zx(1), y: ROW1, retro: ['retro_incontro_eterei'] },
  { n: 'GENERICO', col: '#aeb4c0', x: zx(2), y: ROW1, retro: ['retro_incontro_generico'] },
  { n: 'ARMONIA', col: FAM.armonia.c, x: zx(3), y: ROW1, retro: ['retro_incontro_armonia'] },
  { n: 'ENTROPIA', col: FAM.entropia.c, x: zx(4), y: ROW1, retro: ['retro_incontro_entropia'] },
  { n: 'DEMONIACO', col: FAM.demoniaco.c, x: zx(0), y: ROW2, retro: ['retro_incontro_demoni'] },
  { n: 'NON-MORTI', col: FAM.nonmorti.c, x: zx(1), y: ROW2, retro: ['retro_incontro_nonmorti'] },
  { n: 'OGGETTI', col: '#b0674f', x: zx(3), y: ROW2, retro: ['retro_oggetto'] },
  { n: 'SPELL', col: '#8a4a96', x: zx(4), y: ROW2, retro: ['retro_spell_flusso', 'retro_spell_essenza', 'retro_spell_divinazione'] },
].map(d => ({ ...P, ...d }));

// ---------- META' BASSA: zone attive, promemoria, mappa stellare, scaletta ------------------------
const Y0 = HALF;                                // origine della meta' bassa
const ACTIVE = [
  { n: 'PIANO ATTIVO', sub: 'Il piano in corso:<br>effetto subito.', col: '#c9a15a', x: 26, y: Y0 + 54, ...T },
  { n: 'INCONTRO ATTIVO', sub: 'La carta del turno.<br>Con un 6 sul d6:<br>mazzo Generico.', col: '#aeb4c0', x: 26, y: Y0 + 134, ...P },
];
const NOTE = { x: 98, y: Y0 + 134, w: 48, h: 88 };

// mappa stellare: 3 colonne x 2 righe di cluster. Passo orizzontale fra nodi 25,35mm, verticale 26mm.
// Posizioni dei nodi relative alla cella (75,7 x 88): [x, y] del centro. Piccole variazioni verticali = "costellazione".
const STAR_X0 = 152.5, STAR_Y0 = Y0 + 50, CELL_W = 75.7, CELL_H = 91;
const CX = [12.5, 37.85, 63.2];
const CLUSTERS = [
  { fam: 'armonia', cell: [0, 0], pts: [[CX[0], 22], [CX[1], 19], [CX[2], 23], [CX[0], 48], [CX[1], 46], [CX[2], 50], [CX[0], 74], [CX[1], 72], [CX[2], 75]],
    links: [[0, 1], [1, 2], [3, 4], [4, 5], [6, 7], [7, 8], [0, 3], [3, 6], [1, 4], [4, 7], [2, 5], [5, 8]] },
  { fam: 'elementare', cell: [1, 0], pts: [[25.2, 21], [50.5, 20], [CX[0], 47], [CX[1], 46], [CX[2], 48], [25.2, 73], [50.5, 74]],
    links: [[0, 1], [0, 2], [0, 3], [1, 3], [1, 4], [2, 3], [3, 4], [2, 5], [3, 5], [3, 6], [4, 6], [5, 6]] },
  { fam: 'eterei', cell: [2, 0], pts: [[CX[0], 26], [CX[2], 24], [CX[1], 50], [CX[0], 74], [CX[2], 76]],
    links: [[0, 2], [1, 2], [2, 3], [2, 4], [0, 1], [3, 4]] },
  { fam: 'entropia', cell: [0, 1], pts: [[CX[0], 24], [CX[1], 20], [CX[2], 27], [CX[0], 50], [CX[1], 47], [CX[2], 52], [CX[0], 76], [CX[1], 73], [CX[2], 78]],
    links: [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5], [3, 6], [4, 7], [5, 8], [6, 7], [7, 8]] },
  { fam: 'demoniaco', cell: [1, 1], pts: [[CX[0], 24], [CX[1], 50], [CX[2], 76]], links: [[0, 1], [1, 2]] },
  { fam: 'nonmorti', cell: [2, 1], pts: [[CX[2], 24], [CX[1], 50], [CX[0], 76]], links: [[0, 1], [1, 2]] },
];
const SHORT = { 'Le Porte di Brace': 'Porte di Brace', 'Il Baratro in Fiamme': 'Baratro in Fiamme', "Il Gelo dell'Abisso": "Gelo dell'Abisso", 'La Palude Sconsacrata': 'Palude Sconsacrata', 'Il Velo dei Sussurri': 'Velo dei Sussurri', 'La Voragine della Negatività': 'Voragine' };
const PIANI = JSON.parse(fs.readFileSync(path.join(__dirname, 'piani-data.json'), 'utf8'));
const planeNames = fam => PIANI.filter(p => p.family === fam).map(p => { const n = p.name.replace(/ \(.*\)$/, ''); return SHORT[n] || n; });

// scaletta dei piani pescati: 20 tacche (partita tipica ~15 salti, tetto ~20); avanzamento di livello ogni 5 (max 3: Lv2, Lv3, Lv4)
const LADDER_N = 20, LADDER_PITCH = 17, LADDER_Y = Y0 + 246, LADDER_D = 12;
const LEVEL_AT = { 5: 'LIV. 2', 10: 'LIV. 3', 15: 'LIV. 4' };
const ladderX = i => SEAM_X + (i - (LADDER_N - 1) / 2) * LADDER_PITCH;      // il taglio cade fra la tacca 10 e la 11

// ---------- HTML ------------------------------------------------------------------------------------
const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  .board{ position:absolute; width:${BW}mm; height:${BH}mm; left:0; top:0; }
  .bg{ position:absolute; left:0; width:${BW}mm; height:${HALF}mm; display:block; }
  .fr{ position:absolute; border-radius:3mm; background:rgba(4,5,16,.55); }
  .cd{ position:absolute; overflow:hidden; border-radius:2.4mm; }
  .cd img{ position:absolute; left:0; top:0; width:100%; height:100%; object-fit:cover; display:block; }
  .fan img{ border-radius:2.4mm; box-shadow:0 .5mm 1.6mm rgba(0,0,0,.6); }
  .tx{ position:absolute; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; color:#e9dcc0; padding:0 3mm; }
  .tn{ font-family:'Cinzel',serif; font-weight:700; font-size:4.4mm; letter-spacing:.07em; white-space:nowrap; text-shadow:0 .3mm .8mm rgba(0,0,0,.95); }
  .ts{ margin-top:2mm; font-family:'Source Serif 4',serif; font-style:italic; font-size:3mm; line-height:1.3; color:#cdbf9f; text-shadow:0 .3mm .6mm rgba(0,0,0,.95); }
  .bx{ position:absolute; padding:2.6mm 3mm; color:#e9dcc0; background:rgba(8,12,30,.66); border:.3mm solid rgba(201,161,90,.6); border-radius:2mm; font-family:'Source Serif 4',serif; font-size:2.9mm; line-height:1.28; }
  .bh{ font-family:'Cinzel',serif; font-weight:700; font-size:3.6mm; letter-spacing:.1em; color:#e7c988; margin-bottom:1.4mm; }
  .bx b{ color:#f1d9a0; font-weight:600; }
  .nd{ position:absolute; border-radius:50%; background:rgba(5,7,18,.78); }
  .nl{ position:absolute; text-align:center; font-family:'Source Serif 4',serif; font-size:2.5mm; line-height:1.1; color:#ece1c6; text-shadow:0 0 1mm #000, 0 0 .6mm #000; width:24mm; }
  .ct{ position:absolute; text-align:center; font-family:'Cinzel',serif; font-weight:700; font-size:3.6mm; letter-spacing:.12em; text-shadow:0 0 1.2mm #000; width:${CELL_W}mm; }
  .tk{ position:absolute; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'JetBrains Mono',monospace; font-weight:700; font-size:3.3mm; color:#d9cfae; background:rgba(5,7,18,.78); }
  .tl{ position:absolute; text-align:center; font-family:'JetBrains Mono',monospace; font-weight:700; font-size:2.4mm; letter-spacing:.05em; color:#f1d9a0; width:16mm; text-shadow:0 0 1mm #000; }
`;

function deckHtml(s) {
  const G = 1.0;
  const frame = `<div class="fr" style="left:${s.x - G}mm; top:${s.y - G}mm; width:${s.w + 2 * G}mm; height:${s.h + 2 * G}mm; border:.7mm solid ${s.col}; box-shadow:0 0 2.2mm ${s.col}88;"></div>`;
  if (s.retro && s.retro.length === 1) return frame + `<div class="cd" style="left:${s.x}mm; top:${s.y}mm; width:${s.w}mm; height:${s.h}mm;"><img src="${pathToFileURL(path.join(JPG_CACHE, s.retro[0] + '.jpg')).href}"></div>`;
  const n = s.retro.length;
  const imgs = s.retro.map((r, i) => {
    const rot = (i - (n - 1) / 2) * 8, dx = (i - (n - 1) / 2) * 8;
    return `<img src="${pathToFileURL(path.join(JPG_CACHE, r + '.jpg')).href}" style="position:absolute; left:${(s.w - s.w * 0.74) / 2 + dx}mm; top:${(s.h - s.h * 0.74) / 2}mm; width:${s.w * 0.74}mm; height:${s.h * 0.74}mm; object-fit:cover; transform:rotate(${rot}deg);">`;
  }).join('');
  return frame + `<div class="fan" style="position:absolute; left:${s.x}mm; top:${s.y}mm; width:${s.w}mm; height:${s.h}mm;">${imgs}</div>`;
}
function activeHtml(s) {
  const G = 1.0;
  return `<div class="fr" style="left:${s.x - G}mm; top:${s.y - G}mm; width:${s.w + 2 * G}mm; height:${s.h + 2 * G}mm; border:.7mm solid ${s.col}; box-shadow:0 0 2.2mm ${s.col}88;"></div>
    <div class="tx" style="left:${s.x}mm; top:${s.y}mm; width:${s.w}mm; height:${s.h}mm;"><div class="tn">${s.n}</div><div class="ts">${s.sub}</div></div>`;
}
function starHtml() {
  let html = '', svg = '';
  for (const cl of CLUSTERS) {
    const f = FAM[cl.fam], col = light(f.c, 0.28), names = planeNames(cl.fam);
    const ox = STAR_X0 + cl.cell[0] * CELL_W, oy = STAR_Y0 + cl.cell[1] * CELL_H;
    const abs = cl.pts.map(([x, y]) => [ox + x, oy + y]);
    cl.links.forEach(([a, b]) => { svg += `<line x1="${abs[a][0]}" y1="${abs[a][1]}" x2="${abs[b][0]}" y2="${abs[b][1]}" stroke="${col}" stroke-opacity=".5" stroke-width=".55" stroke-linecap="round"/>`; });
    html += `<div class="ct" style="left:${ox}mm; top:${oy + 1}mm; color:${col};">${f.n}</div>`;
    abs.forEach(([x, y], i) => {
      html += `<div class="nd" style="left:${x - NODE_D / 2}mm; top:${y - NODE_D / 2}mm; width:${NODE_D}mm; height:${NODE_D}mm; border:.8mm solid ${col}; box-shadow:0 0 2mm ${f.c}, inset 0 0 1.5mm ${f.c}88;"></div>
        <div class="nl" style="left:${x - 12}mm; top:${y + NODE_D / 2 + .8}mm;">${names[i] || ''}</div>`;
    });
  }
  return `<svg style="position:absolute; left:0; top:0; width:${BW}mm; height:${BH}mm; overflow:visible" viewBox="0 0 ${BW} ${BH}">${svg}</svg>` + html;
}
function ladderHtml() {
  let h = `<div class="ts" style="position:absolute; left:26mm; top:${LADDER_Y - 13}mm; width:120mm; text-align:left; font-size:2.8mm; margin:0;">PIANI PESCATI: ogni 5, avanzamento di livello (al massimo 3)</div>`;
  for (let i = 0; i < LADDER_N; i++) {
    const n = i + 1, x = ladderX(i), lv = LEVEL_AT[n];
    const d = lv ? LADDER_D + 3 : LADDER_D;
    const col = lv ? '#e7c988' : 'rgba(217,207,174,.65)';
    h += `<div class="tk" style="left:${x - d / 2}mm; top:${LADDER_Y - d / 2}mm; width:${d}mm; height:${d}mm; border:${lv ? '.9mm' : '.5mm'} solid ${col}; ${lv ? 'box-shadow:0 0 2mm #e7c98899; color:#f1d9a0;' : ''}">${n}</div>`;
    if (lv) h += `<div class="tl" style="left:${x - 8}mm; top:${LADDER_Y + d / 2 + 1}mm;">${lv}</div>`;
  }
  return h;
}
const noteHtml = () => `<div class="bx" style="left:${NOTE.x}mm; top:${NOTE.y}mm; width:${NOTE.w}mm; height:${NOTE.h}mm;"><div class="bh">IN BREVE</div>
  <b>Check:</b> 1d6 ≤ al tuo valore, o un 6.<br>Di gruppo: un tiro, vale il valore più alto.<br><br><b>Turno:</b><br>1 Salta · 2 Piano<br>3 Incontro · 4 Fine turno</div>`;

function boardHtml(only) {
  // only: 'top' | 'bot' per i fogli (la parte dell'altro sfondo che cade nel foglio e' zona di sovrapposizione, scartata al taglio)
  const bgs = (only !== 'bot' ? `<img class="bg" style="top:0" src="${pathToFileURL(BG_TOP).href}">` : '') + (only !== 'top' ? `<img class="bg" style="top:${HALF}mm" src="${pathToFileURL(BG_BOT).href}">` : '');
  return bgs
    + DECKS.map(deckHtml).join('') + ACTIVE.map(activeHtml).join('') + noteHtml() + starHtml() + ladderHtml();
}

function sheetHtml(col, row, label) {
  const sx = col === 0 ? 0 : -SHEET_DX, sy = row === 0 ? 0 : -SHEET_DY;
  const cutX = col === 0 ? SEAM_X : SEAM_X - SHEET_DX;     // x della linea di taglio nel foglio
  const cutY = row === 0 ? SEAM_Y : SEAM_Y - SHEET_DY;
  const dash = 'repeating-linear-gradient(%DIR%, rgba(235,235,235,.85) 0 1.2mm, transparent 1.2mm 2.4mm)';
  const cuts = `<div style="position:absolute; left:${cutX - .15}mm; top:0; width:.3mm; height:297mm; background:${dash.replace('%DIR%', '180deg')};"></div>
    <div style="position:absolute; top:${cutY - .15}mm; left:0; height:.3mm; width:210mm; background:${dash.replace('%DIR%', '90deg')};"></div>`;
  const rulY = row === 0 ? 9 : 285;
  const rul = `<div style="position:absolute; left:${col === 0 ? 24 : 24}mm; top:${rulY}mm; width:40mm;"><div style="height:.3mm; background:#ddd;"></div>${[0, 1, 2, 3, 4].map(m => `<i style="position:absolute; left:${m * 10 - .15}mm; top:-1mm; width:.3mm; height:2.3mm; background:#ddd;"></i>`).join('')}<div style="margin-top:.8mm; font:2.2mm sans-serif; color:#cfcfcf; width:100mm;">${label} · righello 40mm: se non misura 40mm stampa al 100%</div></div>`;
  return `<div class="sheet"><div class="board" style="left:${sx}mm; top:${sy}mm;">${boardHtml(row === 0 ? 'top' : 'bot')}</div>${cuts}${rul}</div>`;
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
  console.log('Zone-carta (mm sul tabellone montato 406x580):');
  const zones = [...DECKS.map(d => ({ n: d.n, x: d.x, y: d.y, w: P.w, h: P.h })), ...ACTIVE.map(a => ({ n: a.n, x: a.x, y: a.y, w: a.w, h: a.h }))];
  let ok = true;
  for (const z of zones) {
    const x1 = z.x + z.w, y1 = z.y + z.h;
    const cross = z.y < SEAM_Y && y1 > SEAM_Y;
    const straddleX = z.x < SEAM_X && x1 > SEAM_X;
    if (cross) ok = false;
    console.log(z.n.padEnd(16), `${z.w}x${z.h}`.padEnd(10), `x ${z.x.toFixed(1)}..${x1.toFixed(1)}  y ${z.y}..${y1}`.padEnd(30), cross ? 'ATTRAVERSA y=290!' : '', straddleX ? '(a cavallo di x=203)' : '');
  }
  // nodi: distanza minima fra centri (deve essere >= diametro + etichetta) e posizione rispetto alle giunzioni
  const all = [];
  for (const cl of CLUSTERS) cl.pts.forEach(([x, y], i) => all.push({ fam: cl.fam, i, x: STAR_X0 + cl.cell[0] * CELL_W + x, y: STAR_Y0 + cl.cell[1] * CELL_H + y }));
  let minD = 1e9, pair = '';
  for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) {
    const dx = all[a].x - all[b].x, dy = all[a].y - all[b].y, d = Math.hypot(dx, dy);
    // un nodo e l'etichetta del nodo sopra di lui occupano un rettangolo ~ 24x(18+6): controllo anche sovrapposizione etichetta
    const labelHit = Math.abs(dx) < 15 && dy > 0 && dy < 24.5;   // b sopra a: l'etichetta di b (altezza ~4mm) finisce dentro a
    const labelHit2 = Math.abs(dx) < 15 && dy < 0 && dy > -24.5;
    if (labelHit || labelHit2) { ok = false; console.log('ETICHETTA SOVRAPPOSTA', all[a].fam, all[a].i, all[b].fam, all[b].i, dx.toFixed(1), dy.toFixed(1)); }
    if (d < minD) { minD = d; pair = `${all[a].fam}#${all[a].i} - ${all[b].fam}#${all[b].i}`; }
  }
  console.log(`Nodi: ${all.length} (attesi 36); distanza minima fra centri ${minD.toFixed(1)}mm (${pair}), diametro nodo ${NODE_D}mm => spazio libero fra nodi ${(minD - NODE_D).toFixed(1)}mm`);
  if (all.length !== 36) ok = false;
  const xs = all.map(n => n.x), ys = all.map(n => n.y);
  console.log(`Estensione mappa: x ${(Math.min(...xs) - NODE_D / 2).toFixed(1)}..${(Math.max(...xs) + NODE_D / 2).toFixed(1)}  y ${(Math.min(...ys) - NODE_D / 2).toFixed(1)}..${(Math.max(...ys) + NODE_D / 2 + 6).toFixed(1)} (cornice interna: x ~22.5..383.5, y 315..552)`);
  const seamNodes = all.filter(n => Math.abs(n.x - SEAM_X) < NODE_D / 2 + 1).length;
  console.log(`Nodi che toccano la giunzione x=203: ${seamNodes}`);
  console.log(`Scaletta: ${LADDER_N} tacche, passo ${LADDER_PITCH}mm, x ${ladderX(0).toFixed(1)}..${ladderX(LADDER_N - 1).toFixed(1)}; il taglio (x=203) cade fra la tacca 10 (${ladderX(9).toFixed(1)}) e la 11 (${ladderX(10).toFixed(1)})`);
  console.log(ok ? 'OK' : 'ATTENZIONE: controlla gli avvisi sopra');
}

async function main() {
  if (process.argv.includes('misure')) return misure();
  fs.mkdirSync(OUT_PRINT, { recursive: true });
  fs.mkdirSync(OUT_ALTRO, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
  const ids = [...new Set(DECKS.flatMap(d => d.retro))];
  await convertAll(ids.map(id => ({ id, srcDir: RETRO, outDir: JPG_CACHE })));
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
  // anteprima del tabellone montato
  const k = 96 / 25.4;
  const both = path.join(__dirname, '_tmp-a2-both-' + Date.now() + '.html');
  fs.writeFileSync(both, `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>html,body{background:#0a0d1c} .w{position:relative;width:${BW * k}px;height:${BH * k}px;overflow:hidden} ${CSS}</style></head><body><div class="w"><div class="board">${boardHtml()}</div></div></body></html>`);
  const pg = await browser.newPage({ viewport: { width: Math.round(BW * k), height: Math.round(BH * k) }, deviceScaleFactor: 1.4 });
  await pg.goto(pathToFileURL(both).href); await pg.waitForTimeout(3500);
  await pg.screenshot({ path: path.join(OUT_ALTRO, 'tabellone_A2_anteprima.png') });
  await pg.close(); fs.unlinkSync(both);
  await browser.close();
  console.log('Fatto: tabellone_A2_4fogli.pdf (4 pagine) + anteprima');
}
main().catch(e => { console.error(e); process.exit(1); });
