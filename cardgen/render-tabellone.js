// Tabellone da tavolo: l'immagine unica assets/ui/tabellone.jpg (2464x1728) va stampata su DUE A4
// verticali affiancati (210x297mm l'uno, 420x297mm in tutto): la meta' sinistra sul primo foglio,
// la destra sul secondo. Questo script rimette sopra l'immagine pulita i dorsi dei mazzi (niente icone), i nomi dei due slot di testo e i due
// promemoria (Check e Turno), senza scrivere il numero di carte dei mazzi (si possono aggiungere).
//
// ATTENZIONE alle misure: gli slot dell'immagine hanno le proporzioni giuste (Poker 0,72 e Tarocco 1,71)
// ma, a 420mm di larghezza, misurano ~49x68mm (Poker) e ~87x51mm (Tarocco), cioe' il 78% e il 73% delle
// carte vere (63,5x88 e 120x70). Per carte a misura reale l'immagine dovrebbe essere larga ~540mm (Poker)
// o ~580mm (Tarocco). `node render-tabellone.js misure` stampa il confronto.
//
// Uso: node render-tabellone.js            -> cards_final/print/tabellone_A4_sx.pdf / tabellone_A4_dx.pdf
//      node render-tabellone.js debug      -> disegna i riquadri misurati (controllo della sovrapposizione)
//      node render-tabellone.js misure     -> tabella delle dimensioni reali degli slot
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const SRC = path.join(__dirname, '..', 'assets', 'ui', 'tabellone.jpg');
const OUT_PRINT = path.join(__dirname, '..', 'cards_final', 'print');
const OUT_ALTRO = path.join(__dirname, '..', 'cards_final', 'altro');
const DEBUG = process.argv.includes('debug');
const MISURE = process.argv.includes('misure');

const IMG_W = 2464, IMG_H = 1728;
const MM_PER_PX = 420 / IMG_W;                 // larghezza immagine = 2 x A4 = 420mm
const IMG_H_MM = IMG_H * MM_PER_PX;            // ~294,6mm: entra nei 297mm del foglio
const TOP_MM = (297 - IMG_H_MM) / 2;           // l'immagine sta al centro in verticale
const SPLIT_PX = IMG_W / 2;                    // la linea nera al centro dell'immagine = bordo fra i due fogli

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">`;

// Slot misurati sui pixel dell'immagine (cornice esterna): centro e dimensioni in px
const POKER_PX = { w: 290, h: 401 }, TAROCCO_PX = { w: 511, h: 298 };
const COLX = [1498, 1835, 2170.5], ROWY = [353.5, 863.5, 1377];
// colore cornice -> mazzo, ricavato dal colore dei dorsi delle carte (rosso=Demoniaco, verde=Non-morti,
// blu=Eterei, oro=Armonia, ...).
const SLOTS = [
  // slot con il solo testo (non sono mazzi): nome + breve spiegazione
  { n: 'PIANO ATTUALE', s: 'Effetto subito.<br>Sotto, i piani già visitati.', c: [614.5, 866], ...TAROCCO_PX, ring: '#c9a15a' },
  { n: 'INCONTRO', s: 'La carta del turno.<br>Con un 6 sul d6: Generico.', c: [615, 1377], ...POKER_PX, ring: '#a9adb8' },
  // slot dei mazzi: si stampa il DORSO della carta (cards_final/retro/), cosi' si riconosce a colpo d'occhio
  { c: [614.5, 357], ...TAROCCO_PX, retro: ['retro_piani'] },
  { c: [COLX[0], ROWY[0]], ...POKER_PX, retro: ['retro_incontro_generico'] },
  { c: [COLX[1], ROWY[0]], ...POKER_PX, retro: ['retro_incontro_armonia'] },
  { c: [COLX[2], ROWY[0]], ...POKER_PX, retro: ['retro_incontro_elementare'] },
  { c: [COLX[0], ROWY[1]], ...POKER_PX, retro: ['retro_incontro_demoni'] },
  { c: [COLX[1], ROWY[1]], ...POKER_PX, retro: ['retro_incontro_nonmorti'] },
  { c: [COLX[2], ROWY[1]], ...POKER_PX, retro: ['retro_incontro_entropia'] },
  { c: [COLX[0], ROWY[2]], ...POKER_PX, retro: ['retro_spell_flusso', 'retro_spell_essenza', 'retro_spell_divinazione'] },
  { c: [COLX[1], ROWY[2]], ...POKER_PX, retro: ['retro_incontro_eterei'] },
  { c: [COLX[2], ROWY[2]], ...POKER_PX, retro: ['retro_oggetto'] },
];

const BOXES = [
  { x: 120, y: 1190, w: 330, h: 330, h1: 'CHECK', body: 'Tira <b>1d6</b>: riesce se il risultato è <b>≤ al tuo valore</b>, oppure con un <b>6</b>.<br><br>Check di gruppo: un solo tiro, vale il valore più alto.' },
  { x: 790, y: 1190, w: 340, h: 330, h1: 'IL TURNO', body: '<b>1</b> · Salta nel portale<br><b>2</b> · Effetto del piano<br><b>3</b> · Incontro<br><b>4</b> · Fine turno<br><br>Ogni <b>5 salti</b>: livello.' },
];

const RETRO_DIR = path.join(__dirname, '..', 'cards_final', 'retro');
function slotHtml(s) {
  const l = s.c[0] - s.w / 2, t = s.c[1] - s.h / 2;
  const dbg = DEBUG ? 'outline:2px dashed #f33;' : '';
  if (s.retro) {
    const IN = 16;                                   // margine fra la cornice e il dorso stampato
    const iw = s.w - 2 * IN, ih = s.h - 2 * IN;
    const imgs = s.retro.map((r, i) => {
      const n = s.retro.length;
      // piu' dorsi nello stesso slot (le tre scuole di Spell): a ventaglio, con un leggero angolo
      const rot = n === 1 ? 0 : (i - (n - 1) / 2) * 8;
      const sc = n === 1 ? 1 : 0.76, dx = n === 1 ? 0 : (i - (n - 1) / 2) * 30;
      return `<img class="rt" src="${pathToFileURL(path.join(RETRO_DIR, r + '.png')).href}" style="transform:translateX(${dx}px) rotate(${rot}deg) scale(${sc});">`;
    }).join('');
    return `<div class="slotrt" style="left:${l + IN}px; top:${t + IN}px; width:${iw}px; height:${ih}px;${dbg}">${imgs}</div>`;
  }
  return `<div class="slot" style="left:${l}px; top:${t}px; width:${s.w}px; height:${s.h}px;${dbg}">
    <div class="sn">${s.n}</div><div class="ss">${s.s}</div></div>`;
}

function boardHtml() {
  const slots = SLOTS.map(slotHtml).join('');
  const boxes = BOXES.map(b => `<div class="bx" style="left:${b.x}px; top:${b.y}px; width:${b.w}px; height:${b.h}px;"><div class="bh">${b.h1}</div><div>${b.body}</div></div>`).join('');
  return `<img class="bg" src="${pathToFileURL(SRC).href}">${slots}${boxes}`;
}

const BOARD_CSS = `
  .board, .board *{ box-sizing:border-box; }
  .board{ position:absolute; width:${IMG_W}px; height:${IMG_H}px; transform-origin:0 0; }
  .board img.bg{ position:absolute; left:0; top:0; width:${IMG_W}px; height:${IMG_H}px; display:block; }
  .slot{ position:absolute; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:0 18px; color:#e9dcc0; }
  .sn{ font-family:'Cinzel',serif; font-weight:700; font-size:30px; letter-spacing:.07em; white-space:nowrap; text-shadow:0 2px 6px rgba(0,0,0,.95); }
  .ss{ margin-top:12px; font-family:'Source Serif 4',serif; font-style:italic; font-size:19px; line-height:1.3; color:#cdbf9f; text-shadow:0 2px 5px rgba(0,0,0,.95); }
  .slotrt{ position:absolute; display:flex; align-items:center; justify-content:center; }
  .rt{ position:absolute; width:100%; height:100%; object-fit:cover; border-radius:12px; box-shadow:0 3px 10px rgba(0,0,0,.6); }
  .bx{ position:absolute; padding:20px 22px; color:#e9dcc0; background:rgba(8,12,30,.66); border:2px solid rgba(201,161,90,.6); border-radius:14px; font-family:'Source Serif 4',serif; font-size:23px; line-height:1.35; }
  .bh{ font-family:'Cinzel',serif; font-weight:700; font-size:27px; letter-spacing:.1em; color:#e7c988; margin-bottom:10px; }
  .bx b{ color:#f1d9a0; font-weight:600; }
`;

function pageHtml(side) {
  const k = MM_PER_PX * 96 / 25.4;               // px immagine -> px CSS
  const shiftMm = side === 'sx' ? 0 : -210;
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
    @page{ size:210mm 297mm; margin:0; }
    *{box-sizing:border-box;margin:0;padding:0;}
    html,body{ width:210mm; height:297mm; background:#0a0d1c; }
    body{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .page{ position:relative; width:210mm; height:297mm; overflow:hidden; background:#0a0d1c; }
    ${BOARD_CSS}
    .board{ left:${shiftMm}mm; top:${TOP_MM}mm; transform:scale(${k}); }
  </style></head><body><div class="page"><div class="board">${boardHtml()}</div></div></body></html>`;
}

function misure() {
  console.log(`Scala di stampa: ${MM_PER_PX.toFixed(4)} mm/px (immagine ${IMG_W}px = 420mm, 2 x A4)`);
  console.log('slot'.padEnd(24), 'px'.padEnd(10), 'mm (a 2xA4)'.padEnd(16), 'carta vera'.padEnd(12), 'scala'.padEnd(8), 'larghezza immagine per misura reale');
  for (const s of SLOTS) {
    const real = s.w > s.h ? [120, 70] : [63.5, 88];
    const mm = [s.w * MM_PER_PX, s.h * MM_PER_PX];
    const need = real[0] / s.w * IMG_W;
    console.log((s.n || (s.retro ? s.retro[0].replace('retro_', '') : '?')).padEnd(24), `${s.w}x${s.h}`.padEnd(10), `${mm[0].toFixed(1)}x${mm[1].toFixed(1)}`.padEnd(16), `${real[0]}x${real[1]}`.padEnd(12), (mm[0] / real[0] * 100).toFixed(0).padStart(3) + '%  ', `${need.toFixed(0)}mm`);
  }
}

async function main() {
  if (MISURE) return misure();
  fs.mkdirSync(OUT_PRINT, { recursive: true });
  fs.mkdirSync(OUT_ALTRO, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
  for (const side of ['sx', 'dx']) {
    const tmp = path.join(__dirname, '_tmp-tabellone-' + side + '-' + Date.now() + '.html');
    fs.writeFileSync(tmp, pageHtml(side));
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
    await page.goto(pathToFileURL(tmp).href);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT_ALTRO, `tabellone_A4_${side}${DEBUG ? '_debug' : ''}.png`), clip: { x: 0, y: 0, width: 794, height: 1123 } });
    if (!DEBUG) await page.pdf({ path: path.join(OUT_PRINT, `tabellone_A4_${side}.pdf`), printBackground: true, preferCSSPageSize: true });
    await page.close();
    fs.unlinkSync(tmp);
    console.log('Fatto: tabellone_A4_' + side);
  }
  // anteprima dei due fogli affiancati
  const both = path.join(__dirname, '_tmp-tabellone-both-' + Date.now() + '.html');
  const k = MM_PER_PX * 96 / 25.4;
  fs.writeFileSync(both, `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>*{margin:0;padding:0} html,body{background:#0a0d1c} .w{position:relative;width:${IMG_W * k}px;height:${297 * 96 / 25.4}px;overflow:hidden} ${BOARD_CSS} .board{left:0;top:${TOP_MM * 96 / 25.4}px;transform:scale(${k})}</style></head><body><div class="w"><div class="board">${boardHtml()}</div></div></body></html>`);
  const pg = await browser.newPage({ viewport: { width: Math.round(IMG_W * k), height: Math.round(297 * 96 / 25.4) } });
  await pg.goto(pathToFileURL(both).href); await pg.waitForTimeout(2000);
  await pg.screenshot({ path: path.join(OUT_ALTRO, 'tabellone_A4_insieme.png') });
  await pg.close(); fs.unlinkSync(both);
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
