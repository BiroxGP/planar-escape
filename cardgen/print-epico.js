// Print-and-play del mazzo Epico, delle due spell nuove e delle pedine Piano.
//   Foglio 1 (epico_carte_fronte/retro.pdf): le 8 carte Epico, 3x3 (Poker 63,5x88mm), il retro e' unico.
//   Foglio 2 (epico_spell_pedine_fronte/retro.pdf): Via murata e Sentiero battuto (ognuna col retro della sua scuola) +
//   48 pedine Piano da 15mm (stessa immagine su entrambi i lati: il retro e' specchiato come le carte).
// Fronte/retro si stampano sul lato lungo, a dimensione reale (100%). Righello di calibrazione di 40mm in fondo al foglio 2.
//
// Prima: node render-pedine.js piano   (produce cards_final/pedine/pedina_piano.png)
// Uso:   node print-epico.js
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const { convertAll } = require('./png-to-jpg-cache.js');

const CARDS_DIR = path.join(__dirname, '..', 'assets', 'cards');
const RETRO_DIR = path.join(__dirname, '..', 'cards_final', 'retro');
const JPG_CACHE_DIR = path.join(__dirname, '..', 'cards_final', 'print', '_jpgcache');
const OUT_DIR = path.join(__dirname, '..', 'cards_final', 'print');
const COIN_PNG = path.join(__dirname, '..', 'cards_final', 'pedine', 'pedina_piano.png');
const PAGE_W = 210, PAGE_H = 297, MARGIN = 5;
const CW = 63.5, CH = 88;
const COIN = 15, COIN_GAP = 5;

const EPICO = ['ep_custode', 'ep_altare', 'ep_mappastellare', 'ep_eco', 'ep_patto', 'ep_fenditura', 'ep_banchetto', 'ep_lascito']
  .map(id => ({ id, back: 'retro_incontro_epico' }));
const SPELLS = [
  { id: 'sp_viamurata', back: 'retro_spell_divinazione' },
  { id: 'sp_sentierobattuto', back: 'retro_spell_essenza' },
];

const COLS = Math.floor((PAGE_W - 2 * MARGIN) / CW);                // 3
const ROWS = Math.floor((PAGE_H - 2 * MARGIN) / CH);                // 3
const GX = (PAGE_W - COLS * CW) / 2, GY = (PAGE_H - ROWS * CH) / 2;

const jpg = id => pathToFileURL(path.join(JPG_CACHE_DIR, id + '.jpg')).href;
const mirrorX = (x, w) => PAGE_W - x - w;

function cardCell(x, y, src) {
  return `<div class="cell" style="left:${x}mm; top:${y}mm; width:${CW}mm; height:${CH}mm;"><img src="${src}">
    <i class="crop tl"></i><i class="crop tr"></i><i class="crop bl"></i><i class="crop br"></i></div>`;
}
function coinCell(x, y) {
  return `<div class="coin" style="left:${x}mm; top:${y}mm; width:${COIN}mm; height:${COIN}mm;"><img src="${pathToFileURL(COIN_PNG).href}"></div>`;
}

// Foglio 1: 8 carte Epico nei primi 8 posti della griglia 3x3
function sheet1(mirror) {
  const cells = EPICO.map((it, i) => {
    const row = Math.floor(i / COLS), col = i % COLS;
    const drawCol = mirror ? COLS - 1 - col : col;
    return cardCell(GX + drawCol * CW, GY + row * CH, jpg(mirror ? it.back : it.id));
  });
  return cells.join('\n');
}

// Foglio 2: 2 spell + blocco di 12 pedine nei tre posti della prima fila, poi 4 file da 9 pedine (36): 48 in tutto
const COIN_COUNT = 12 + 36;
function sheet2(mirror) {
  const out = [];
  SPELLS.forEach((it, i) => {
    const drawCol = mirror ? COLS - 1 - i : i;
    out.push(cardCell(GX + drawCol * CW, GY, jpg(mirror ? it.back : it.id)));
  });
  // blocco 3x4 nel terzo posto (63,5x88): 3 colonne x 4 righe, passo 20mm, centrato nel posto
  const blockW = 3 * COIN + 2 * COIN_GAP, blockH = 4 * COIN + 3 * COIN_GAP;
  const slotCol = mirror ? 0 : COLS - 1;
  const bx = GX + slotCol * CW + (CW - blockW) / 2, by = GY + (CH - blockH) / 2;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    const x = bx + c * (COIN + COIN_GAP);
    out.push(coinCell(mirror ? mirrorX(mirrorX(x, COIN), COIN) : x, by + r * (COIN + COIN_GAP)));
  }
  // 4 file da 9 sotto le carte
  const rowW = 9 * COIN + 8 * COIN_GAP, x0 = (PAGE_W - rowW) / 2, y0 = GY + CH + 8;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) {
    const x = x0 + c * (COIN + COIN_GAP);
    out.push(coinCell(mirror ? mirrorX(x, COIN) : x, y0 + r * (COIN + COIN_GAP)));
  }
  // righello 40mm
  const rx = (PAGE_W - 40) / 2, ry = PAGE_H - 22;
  out.push(`<div class="ruler" style="left:${rx}mm; top:${ry}mm;"><div class="bar"></div>${[0, 1, 2, 3, 4].map(m => `<i class="tick" style="left:${m * 10 - .15}mm;"></i>`).join('')}
    <div class="lab">Pedine Piano 15mm (${COIN_COUNT}) + spell nuove — ${mirror ? 'retro' : 'fronte'} · righello: deve misurare 40mm, stampa al 100%</div></div>`);
  return out.join('\n');
}

function html(body) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{ background:#fff; }
    .sheet{ position:relative; width:${PAGE_W}mm; height:${PAGE_H}mm; overflow:hidden; }
    .cell{ position:absolute; } .cell img{ display:block; width:100%; height:100%; }
    .coin{ position:absolute; border-radius:50%; box-shadow:0 0 0 .2mm #999; } .coin img{ display:block; width:100%; height:100%; border-radius:50%; }
    .crop{ position:absolute; display:block; }
    .crop.tl{ left:-3.5mm; top:0; width:3mm; height:.25mm; background:#999; } .crop.tl::after{ content:''; position:absolute; left:0; top:-3.5mm; width:.25mm; height:3mm; background:#999; }
    .crop.tr{ right:-3.5mm; top:0; width:3mm; height:.25mm; background:#999; } .crop.tr::after{ content:''; position:absolute; right:0; top:-3.5mm; width:.25mm; height:3mm; background:#999; }
    .crop.bl{ left:-3.5mm; bottom:0; width:3mm; height:.25mm; background:#999; } .crop.bl::after{ content:''; position:absolute; left:0; bottom:-3.5mm; width:.25mm; height:3mm; background:#999; }
    .crop.br{ right:-3.5mm; bottom:0; width:3mm; height:.25mm; background:#999; } .crop.br::after{ content:''; position:absolute; right:0; bottom:-3.5mm; width:.25mm; height:3mm; background:#999; }
    .ruler{ position:absolute; width:40mm; } .ruler .bar{ width:40mm; height:.3mm; background:#000; }
    .ruler .tick{ position:absolute; top:-1mm; width:.3mm; height:2.3mm; background:#000; }
    .ruler .lab{ margin-top:1.5mm; width:150mm; margin-left:-55mm; text-align:center; font-family:sans-serif; font-size:2.6mm; line-height:1.35; color:#333; }
  </style></head><body><div class="sheet">${body}</div></body></html>`;
}

async function main() {
  if (!fs.existsSync(COIN_PNG)) throw new Error('manca ' + COIN_PNG + ': esegui prima node render-pedine.js piano');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const pairs = []; const seen = new Set();
  for (const it of [...EPICO, ...SPELLS]) {
    if (!seen.has(it.id)) { seen.add(it.id); pairs.push({ id: it.id, srcDir: CARDS_DIR, outDir: JPG_CACHE_DIR }); }
    if (!seen.has(it.back)) { seen.add(it.back); pairs.push({ id: it.back, srcDir: RETRO_DIR, outDir: JPG_CACHE_DIR }); }
  }
  await convertAll(pairs);
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const jobs = [
    ['epico_carte_fronte', sheet1(false)], ['epico_carte_retro', sheet1(true)],
    ['epico_spell_pedine_fronte', sheet2(false)], ['epico_spell_pedine_retro', sheet2(true)],
  ];
  for (const [name, body] of jobs) {
    const tmp = path.join(__dirname, '_print-epico-' + name + '.html');
    fs.writeFileSync(tmp, html(body));
    const page = await browser.newPage();
    await page.goto('file://' + tmp + '?t=' + Date.now());
    await page.waitForTimeout(500);
    await page.pdf({ path: path.join(OUT_DIR, name + '.pdf'), printBackground: true, width: PAGE_W + 'mm', height: PAGE_H + 'mm', margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    await page.close();
    fs.unlinkSync(tmp);
  }
  await browser.close();
  console.log('Fatto: epico_carte_fronte/retro.pdf (8 carte Epico) + epico_spell_pedine_fronte/retro.pdf (2 spell + ' + COIN_COUNT + ' pedine) in ' + OUT_DIR);
}
main().catch(e => { console.error(e); process.exit(1); });
