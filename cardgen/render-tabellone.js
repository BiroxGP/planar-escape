// Tabellone da tavolo in due metà (sinistra / destra), ognuna su un A4 verticale ESATTO
// (210x297mm, a pieno foglio) cosi' che stampate una accanto all'altra combacino al centro.
// Le due immagini originali hanno proporzioni diverse dall'A4 (sx 1604x2528, dx 1637x2464):
// vengono adattate al foglio senza tagliare nulla (cornici e targhetta restano intere) con un
// leggero allargamento in orizzontale (sx +11%, dx +6%), uguale in altezza: cosi' le cornici
// in alto e in basso restano alla stessa quota sui due fogli e il bordo centrale si incontra.
// Tutti i testi sono posizionati in percentuale della pagina, quindi seguono l'immagine.
//
// Uso: node render-tabellone.js          -> cards_final/print/tabellone_sx.pdf / tabellone_dx.pdf
//                                           (+ anteprime in cards_final/altro/)
//      node render-tabellone.js a3       -> versione a scala vera (carte Poker esatte) su due A3: tabellone_sx_A3.pdf / tabellone_dx_A3.pdf
//      node render-tabellone.js tessere  -> la versione A3 a scala vera spezzata in 4 fogli A4 per metà (stampante A4):
//                                           tabellone_sx_tessere_A4.pdf / tabellone_dx_tessere_A4.pdf, da unire
//      node render-tabellone.js tutti    -> A4 e A3
//      ... debug                         -> disegna anche i riquadri misurati, per ritoccarli
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const UI = path.join(__dirname, '..', 'assets', 'ui');
const OUT_PRINT = path.join(__dirname, '..', 'cards_final', 'print');
const OUT_ALTRO = path.join(__dirname, '..', 'cards_final', 'altro');
const DEBUG = process.argv.includes('debug');
const TESSERE = process.argv.includes('tessere');
const FMT_LIST = TESSERE ? [] : (process.argv.includes('a3') ? ['a3'] : (process.argv.includes('tutti') ? ['a4', 'a3'] : ['a4']));

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">`;

// Riquadri in frazione della pagina: [x0, y0, x1, y1]. Misurati sulle immagini.
const SX = {
  img: 'tabellone_sx.jpg',
  slots: [
    { r: [0.2427, 0.0980, 0.8140, 0.3180], t: 'MAZZO PIANI', s: 'Carte Piano coperte, si pesca dalla cima.<br>La destinazione è sempre casuale.' },
    { r: [0.2427, 0.3420, 0.8140, 0.5670], t: 'PIANO ATTUALE', s: 'Il Piano appena pescato: applica subito il suo effetto. Sotto, i piani già visitati (scarti).' },
    { r: [0.3741, 0.5933, 0.6852, 0.8631], t: 'INCONTRO', s: 'La carta Incontro del turno.<br>d6 = 6: si pesca dal Generico.' },
  ],
  gaps: [
    { r: [0.2427, 0.3180, 0.8140, 0.3420], t: '▼ si salta' },
    { r: [0.2427, 0.5670, 0.8140, 0.5940], t: '▼ poi l\'Incontro' },
  ],
  boxes: [
    { r: [0.1300, 0.6150, 0.3600, 0.8300], h: 'CHECK', body: 'Tira <b>1d6</b>: riesce se è <b>≤ al tuo valore</b>, oppure con un <b>6</b>.<br><br>Check di gruppo: un tiro solo, vale il valore più alto.' },
    { r: [0.7000, 0.6150, 0.9600, 0.8300], h: 'IL TURNO', body: '<b>1</b> Salta<br><b>2</b> Effetto del piano<br><b>3</b> Incontro<br><b>4</b> Fine turno<br><br>Ogni <b>5 salti</b>: livello.' },
  ],
  plaque: { r: [0.3550, 0.9000, 0.7050, 0.9550], t: 'IL VIAGGIO' },
  // cornici poker (mm reali, solo versione A3): centro in frazione della metà, misure della carta + ~0,4mm di gioco
  pokerFrames: [{ c: [849 / 1604, 1839 / 2528], w: 64.2, h: 89.4 }],
};
const DX = {
  img: 'tabellone_dx.jpg',
  slots: (() => {
    const cx = [[0.0647, 0.3220], [0.3424, 0.5997], [0.6208, 0.8774]];
    const ry = [[0.1005, 0.3380], [0.3565, 0.5950], [0.6150, 0.8635]];
    const labels = [
      ['DEMONIACO', 'Incontri · 12 carte<br>Gironi infernali'],
      ['ARMONIA', 'Incontri · 15 carte<br>Ordine, Legge, Sacro'],
      ['ENTROPIA', 'Incontri · 15 carte<br>Caos, Tempo, Vuoto'],
      ['ELEMENTARE', 'Incontri · 15 carte<br>Fuoco, Acqua, Veleno'],
      ['OGGETTI', '60 carte<br>Mazzo unico: non si rimescola'],
      ['NON-MORTI', 'Incontri · 12 carte<br>Il Piano Negativo'],
      ['GENERICO', 'Incontri · 14 carte<br>Con un 6 sul d6, da ogni piano'],
      ['SPELL', '31 carte<br>Flusso · Essenza · Divinazione'],
      ['ETEREI', 'Incontri · 15 carte<br>Sogno, Specchi, Luce'],
    ];
    return labels.map((l, i) => ({ r: [cx[i % 3][0], ry[Math.floor(i / 3)][0], cx[i % 3][1], ry[Math.floor(i / 3)][1]], t: l[0], s: l[1] }));
  })(),
  gaps: [],
  boxes: [],
  plaque: { r: [0.3000, 0.9000, 0.6500, 0.9550], t: 'I MAZZI' },
  pokerFrames: [],
};

function pct(v) { return (v * 100).toFixed(3) + '%'; }
function box(r) { return `left:${pct(r[0])}; top:${pct(r[1])}; width:${pct(r[2] - r[0])}; height:${pct(r[3] - r[1])};`; }

// Misure per formato carta.
//  a4: ogni metà riempie un A4 verticale (210x297mm). Le slot restano pero' PIU' PICCOLE di una carta Poker
//      (63,5x88mm): a questa scala i riquadri di destra misurano circa 54x70mm.
//  a3: scala "vera" (0,151 mm per pixel dell'immagine destra): i riquadri di destra diventano esattamente
//      Poker (63,5x88mm) e quelli di sinistra (Tarocco 120x70, Poker) hanno tutti un po' di margine in piu'.
//      Ogni metà e' su un A3 verticale (297x420mm), con le due metà accostate al CENTRO (la sinistra a filo
//      del bordo destro del suo foglio, la destra a filo del bordo sinistro del suo).
const MM_PER_PX = 0.151;
const A3_BOARD_H = 377; // altezza comune alle due metà, cosi' le cornici combaciano al centro
const FORMATS = {
  a4: { pageW: 210, pageH: 297, board: { sx: { x: 0, y: 0, w: 210, h: 297 }, dx: { x: 0, y: 0, w: 210, h: 297 } } },
  a3: { pageW: 297, pageH: 420, board: {
    sx: { w: 1604 * MM_PER_PX, h: A3_BOARD_H, x: 297 - 1604 * MM_PER_PX, y: (420 - A3_BOARD_H) / 2 },
    dx: { w: 1637 * MM_PER_PX, h: A3_BOARD_H, x: 0, y: (420 - A3_BOARD_H) / 2 },
  } },
};
// le misure in mm dei testi si moltiplicano per k (larghezza della metà / 210mm), cosi' le scritte crescono con l'immagine
function scaleMm(css) { return css.replace(/(\d*\.?\d+)mm/g, (m, n) => `calc(${n}mm * var(--k))`); }

function pageHtml(cfg, fmt, side) {
  const F = FORMATS[fmt], B = F.board[side];
  const k = B.w / 210;
  const slots = cfg.slots.map(s => `<div class="slot${DEBUG ? ' dbg' : ''}" style="${box(s.r)}"><div class="st">${s.t}</div><div class="ss">${s.s}</div></div>`).join('');
  const gaps = cfg.gaps.map(g => `<div class="gap${DEBUG ? ' dbg' : ''}" style="${box(g.r)}">${g.t}</div>`).join('');
  const boxes = cfg.boxes.map(b => `<div class="bx${DEBUG ? ' dbg' : ''}" style="${box(b.r)}"><div class="bh">${b.h}</div><div class="bb">${b.body}</div></div>`).join('');
  const pf = fmt === 'a3' ? (cfg.pokerFrames || []).map(f => `<div class="pf" style="left:${pct(f.c[0] - f.w / 2 / B.w)}; top:${pct(f.c[1] - f.h / 2 / B.h)}; width:${pct(f.w / B.w)}; height:${pct(f.h / B.h)};"></div>`).join('') : '';
  const pl = `<div class="plq${DEBUG ? ' dbg' : ''}" style="${box(cfg.plaque.r)}">${cfg.plaque.t}</div>`;
  const overlayCss = scaleMm(`
    .slot{ position:absolute; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:0 7%; color:#e9dcc0; }
    .st{ font-family:'Cinzel',serif; font-weight:700; font-size:4.8mm; letter-spacing:.07em; white-space:nowrap; text-shadow:0 .3mm .8mm rgba(0,0,0,.9); }
    .ss{ margin-top:2mm; font-family:'Source Serif 4',serif; font-style:italic; font-size:3.1mm; line-height:1.3; color:#cdbf9f; text-shadow:0 .3mm .6mm rgba(0,0,0,.9); }
    .gap{ position:absolute; display:flex; align-items:center; justify-content:center; font-family:'JetBrains Mono',monospace; font-weight:700; font-size:2.6mm; letter-spacing:.08em; color:#b9a77c; text-transform:uppercase; }
    .bx{ position:absolute; padding:3mm 3.4mm; color:#e9dcc0; background:rgba(8,12,30,.62); border:.3mm solid rgba(201,161,90,.6); border-radius:2mm; font-family:'Source Serif 4',serif; font-size:3.3mm; line-height:1.3; }
    .bh{ font-family:'Cinzel',serif; font-weight:700; font-size:4mm; letter-spacing:.1em; color:#e7c988; margin-bottom:1.6mm; }
    .bx b{ color:#f1d9a0; font-weight:600; }
    .plq{ position:absolute; display:flex; align-items:center; justify-content:center; font-family:'Cinzel',serif; font-weight:700; font-size:5.4mm; letter-spacing:.14em; color:#3b2f1c; text-shadow:0 .25mm 0 rgba(255,244,214,.55); }
    .dbg{ outline:.4mm dashed rgba(255,60,60,.9); background:rgba(255,60,60,.08); }
  `);
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
    @page{ size:${F.pageW}mm ${F.pageH}mm; margin:0; }
    *{box-sizing:border-box;margin:0;padding:0;}
    html,body{ width:${F.pageW}mm; height:${F.pageH}mm; background:#fff; }
    body{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .page{ position:relative; width:${F.pageW}mm; height:${F.pageH}mm; overflow:hidden; background:#fff; }
    .board{ position:absolute; left:${B.x}mm; top:${B.y}mm; width:${B.w}mm; height:${B.h}mm; --k:${k}; }
    .board img.bg{ position:absolute; left:0; top:0; width:100%; height:100%; display:block; }
    ${overlayCss}
    .pf{ position:absolute; border:.5mm solid #b9bfce; border-radius:2.2mm; background:rgba(3,5,16,.45); box-shadow:0 0 1.6mm rgba(185,191,206,.35), inset 0 0 1.2mm rgba(0,0,0,.6); }
  </style></head><body><div class="page"><div class="board"><img class="bg" src="${pathToFileURL(path.join(UI, cfg.img)).href}">${pf}${slots}${gaps}${boxes}${pl}</div></div></body></html>`;
}

// ---- tessere A4: ogni metà A3 divisa in 2 colonne x 2 righe, con un lembo di sovrapposizione di 8mm
const TILE_M = 12, FLAP = 8, T_COLS = 2, T_ROWS = 2;
function tilesHtml(side, boardFile, label) {
  const F = FORMATS.a3, B = F.board[side];
  const sw = B.w / T_COLS, sh = B.h / T_ROWS;
  const pages = [];
  for (let r = 0; r < T_ROWS; r++) for (let c = 0; c < T_COLS; c++) {
    const fx = c < T_COLS - 1 ? FLAP : 0, fy = r < T_ROWS - 1 ? FLAP : 0;
    const ox = B.x + c * sw, oy = B.y + r * sh;
    const cw = sw + fx, ch = sh + fy;
    const tick = (x, y, w, h) => `<i class="tk" style="left:${x}mm; top:${y}mm; width:${w}mm; height:${h}mm;"></i>`;
    const marks = [
      // limiti della "tessera pulita" (senza lembo): segni nel margine bianco, in alto e in basso / a sinistra e a destra
      tick(TILE_M, TILE_M - 6, .3, 4), tick(TILE_M + sw, TILE_M - 6, .3, 4),
      tick(TILE_M, TILE_M + ch + 2, .3, 4), tick(TILE_M + sw, TILE_M + ch + 2, .3, 4),
      tick(TILE_M - 6, TILE_M, 4, .3), tick(TILE_M - 6, TILE_M + sh, 4, .3),
      tick(TILE_M + cw + 2, TILE_M, 4, .3), tick(TILE_M + cw + 2, TILE_M + sh, 4, .3),
    ].join('');
    const map = [0, 1].map(rr => [0, 1].map(cc => `<i class="mp${rr === r && cc === c ? ' on' : ''}" style="left:${cc * 5}mm; top:${rr * 7}mm;"></i>`).join('')).join('');
    pages.push(`<div class="tile">
      <div class="clip" style="left:${TILE_M}mm; top:${TILE_M}mm; width:${cw}mm; height:${ch}mm;"><iframe src="${pathToFileURL(boardFile).href}" style="left:${-ox}mm; top:${-oy}mm; width:${F.pageW}mm; height:${F.pageH}mm;"></iframe></div>
      ${marks}
      <div class="lab" style="left:${TILE_M}mm; top:${TILE_M + ch + 8}mm;">
        <b>${label}</b> — tessera ${r * T_COLS + c + 1} di ${T_COLS * T_ROWS} (riga ${r + 1}, colonna ${c + 1})<br>
        Stampa al 100% (non "adatta alla pagina"). Taglia lungo i segni; il lembo di ${FLAP}mm (a destra / in basso) si sovrappone alla tessera vicina: fai combaciare il disegno e incolla.
      </div>
      <div class="map" style="left:${TILE_M + 140}mm; top:${TILE_M + ch + 8}mm;">${map}</div>
    </div>`);
  }
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{ size:210mm 297mm; margin:0; }
    *{box-sizing:border-box;margin:0;padding:0;}
    html,body{ background:#fff; }
    body{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .tile{ position:relative; width:210mm; height:297mm; overflow:hidden; page-break-after:always; }
    .clip{ position:absolute; overflow:hidden; background:#fff; }
    .clip iframe{ position:absolute; border:0; }
    .tk{ position:absolute; display:block; background:#000; }
    .lab{ position:absolute; width:130mm; font-family:sans-serif; font-size:2.8mm; line-height:1.4; color:#333; }
    .map{ position:absolute; width:12mm; height:16mm; }
    .mp{ position:absolute; width:4mm; height:6mm; border:.25mm solid #666; }
    .mp.on{ background:#666; }
  </style></head><body>${pages.join('')}</body></html>`;
}

async function mainTessere() {
  fs.mkdirSync(OUT_PRINT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
  for (const [name, cfg] of [['sx', SX], ['dx', DX]]) {
    const boardFile = path.join(__dirname, '_tmp-board-' + name + '-' + Date.now() + '.html');
    fs.writeFileSync(boardFile, pageHtml(cfg, 'a3', name));
    const tilesFile = path.join(__dirname, '_tmp-tessere-' + name + '-' + Date.now() + '.html');
    fs.writeFileSync(tilesFile, tilesHtml(name, boardFile, name === 'sx' ? 'Tabellone SINISTRO' : 'Tabellone DESTRO'));
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
    await page.goto(pathToFileURL(tilesFile).href);
    await page.waitForTimeout(3500);
    await page.pdf({ path: path.join(OUT_PRINT, `tabellone_${name}_tessere_A4.pdf`), printBackground: true, preferCSSPageSize: true });
    await page.setViewportSize({ width: 794, height: 1123 * 4 });
    await page.screenshot({ path: path.join(OUT_ALTRO, `tabellone_${name}_tessere_anteprima.png`), fullPage: true });
    await page.close();
    fs.unlinkSync(boardFile); fs.unlinkSync(tilesFile);
    console.log('Fatto: tabellone_' + name + '_tessere_A4');
  }
  await browser.close();
}

async function main() {
  if (TESSERE) return mainTessere();
  fs.mkdirSync(OUT_PRINT, { recursive: true });
  fs.mkdirSync(OUT_ALTRO, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
  for (const fmt of FMT_LIST) {
    for (const [name, cfg] of [['sx', SX], ['dx', DX]]) {
      const F = FORMATS[fmt];
      const px = 3.7795; // px per mm (96dpi)
      const tmp = path.join(__dirname, '_tmp-tabellone-' + name + '-' + Date.now() + '.html');
      fs.writeFileSync(tmp, pageHtml(cfg, fmt, name));
      const page = await browser.newPage({ viewport: { width: Math.round(F.pageW * px), height: Math.round(F.pageH * px) }, deviceScaleFactor: 1.5 });
      await page.goto('file://' + tmp);
      await page.waitForTimeout(1500);
      const base = `tabellone_${name}${fmt === 'a3' ? '_A3' : ''}`;
      await page.screenshot({ path: path.join(OUT_ALTRO, base + (DEBUG ? '_debug' : '') + '.png'), clip: { x: 0, y: 0, width: Math.round(F.pageW * px), height: Math.round(F.pageH * px) } });
      if (!DEBUG) await page.pdf({ path: path.join(OUT_PRINT, base + '.pdf'), printBackground: true, preferCSSPageSize: true });
      await page.close();
      fs.unlinkSync(tmp);
      console.log('Fatto:', base);
    }
  }
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
