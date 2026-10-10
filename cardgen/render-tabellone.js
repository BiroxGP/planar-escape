// Tabellone da tavolo su DUE A4 verticali affiancati (420x297mm): lo sfondo vuoto (assets/ui/tabellone_vuoto.jpg,
// 2464x1728 = 420x294,6mm) e' dell'utente; qui sopra si disegnano gli slot A MISURA REALE DELLA CARTA
// (Poker 63,5x88mm, Tarocco 120x70mm), i dorsi dei mazzi, i testi e i promemoria. Nessuna icona, nessun
// conteggio di carte. Oggetti e Spell stanno su un mini-tappetino a parte (terza pagina).
// Tutte le misure sono in mm sul foglio doppio (0..420 x 0..297); il taglio fra i due A4 e' a x=210.
//
// Uso: node render-tabellone.js   -> cards_final/print/tabellone_A4_sx.pdf, tabellone_A4_dx.pdf, tabellone_A4_extra.pdf
//      node render-tabellone.js misure -> controlla che gli slot stiano dentro la cornice e i margini di stampa
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const UI = path.join(__dirname, '..', 'assets', 'ui');
const RETRO = path.join(__dirname, '..', 'cards_final', 'retro');
const OUT_PRINT = path.join(__dirname, '..', 'cards_final', 'print');
const OUT_ALTRO = path.join(__dirname, '..', 'cards_final', 'altro');
const BG = path.join(UI, 'tabellone_vuoto.jpg');

const IMG_W = 2464, IMG_H = 1728;
const BG_H_MM = IMG_H * 420 / IMG_W;           // 294,6mm
const BG_TOP = (297 - BG_H_MM) / 2;            // l'immagine e' centrata in verticale
const PRINT_MARGIN = 5;                        // margine non stampabile tipico di una stampante A4

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">`;

const P = { w: 63.5, h: 88 }, T = { w: 120, h: 70 };
// righe: Tarocco y16..86, Poker y93..181 e y188..276 (la cornice dello sfondo e' a ~13mm dai bordi: restano ~3mm)
const ROW = { A: 16, B: 93, C: 188 };
const LX = [26, 100], RX = [256.5, 330.5];     // colonne Poker: simmetriche rispetto al taglio (x=210)
const SLOTS = [
  { n: 'MAZZO PIANI', x: 26, y: ROW.A, ...T, col: '#c9a15a', retro: ['retro_piani'] },
  { n: 'PIANO ATTUALE', x: 274, y: ROW.A, ...T, col: '#c9a15a', txt: 'Effetto subito.<br>Sotto, i piani già visitati.' },
  { n: 'GENERICO', x: LX[0], y: ROW.B, ...P, col: '#b9bdc8', retro: ['retro_incontro_generico'] },
  { n: 'ARMONIA', x: LX[1], y: ROW.B, ...P, col: '#c9a15a', retro: ['retro_incontro_armonia'] },
  { n: 'NON-MORTI', x: LX[0], y: ROW.C, ...P, col: '#4f8a68', retro: ['retro_incontro_nonmorti'] },
  { n: 'ENTROPIA', x: LX[1], y: ROW.C, ...P, col: '#8a7fc0', retro: ['retro_incontro_entropia'] },
  { n: 'INCONTRO', x: RX[0], y: ROW.B, ...P, col: '#b9bdc8', txt: 'La carta del turno.<br>Con un 6 sul d6: Generico.' },
  { n: 'ETEREI', x: RX[1], y: ROW.B, ...P, col: '#4a86c0', retro: ['retro_incontro_eterei'] },
  { n: 'ELEMENTARE', x: RX[0], y: ROW.C, ...P, col: '#d08a3d', retro: ['retro_incontro_elementare'] },
  { n: 'DEMONIACO', x: RX[1], y: ROW.C, ...P, col: '#c8504a', retro: ['retro_incontro_demoni'] },
];
// promemoria nel centro in alto, uno per parte del taglio (nessun testo attraversa x=210)
const BOXES = [
  { x: 152, y: 16, w: 53, h: 70, h1: 'CHECK', body: 'Tira <b>1d6</b>: riesce se il risultato è <b>≤ al tuo valore</b>, oppure con un <b>6</b>.<br><br>Check di gruppo: un solo tiro, vale il valore più alto.' },
  { x: 215, y: 16, w: 53, h: 70, h1: 'IL TURNO', body: '<b>1</b> · Salta nel portale<br><b>2</b> · Effetto del piano<br><b>3</b> · Incontro<br><b>4</b> · Fine turno<br><br>Ogni <b>5 salti</b>: livello.' },
];
// mini-tappetino (terza pagina): Oggetti e Spell, fuori dal tabellone
const EXTRA = [
  { n: 'OGGETTI', x: 30, y: 90, ...P, col: '#b0674f', retro: ['retro_oggetto'] },
  { n: 'SPELL', x: 116.5, y: 90, ...P, col: '#8a4a96', retro: ['retro_spell_flusso', 'retro_spell_essenza', 'retro_spell_divinazione'] },
];

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  .mat{ position:absolute; width:420mm; height:297mm; top:0; }
  .mat img.bg{ position:absolute; left:0; top:${BG_TOP}mm; width:420mm; height:${BG_H_MM}mm; display:block; }
  .fr{ position:absolute; border-radius:3mm; background:rgba(4,5,16,.5); }
  .cd{ position:absolute; overflow:hidden; border-radius:2.4mm; }
  .cd img{ position:absolute; left:0; top:0; width:100%; height:100%; object-fit:cover; display:block; }
  .fan img{ border-radius:2.4mm; box-shadow:0 .5mm 1.6mm rgba(0,0,0,.6); }
  .tx{ position:absolute; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; color:#e9dcc0; padding:0 3mm; }
  .tn{ font-family:'Cinzel',serif; font-weight:700; font-size:4.4mm; letter-spacing:.07em; white-space:nowrap; text-shadow:0 .3mm .8mm rgba(0,0,0,.95); }
  .ts{ margin-top:2mm; font-family:'Source Serif 4',serif; font-style:italic; font-size:3mm; line-height:1.3; color:#cdbf9f; text-shadow:0 .3mm .6mm rgba(0,0,0,.95); }
  .bx{ position:absolute; padding:3mm 3.4mm; color:#e9dcc0; background:rgba(8,12,30,.62); border:.3mm solid rgba(201,161,90,.6); border-radius:2mm; font-family:'Source Serif 4',serif; font-size:3.2mm; line-height:1.3; }
  .bh{ font-family:'Cinzel',serif; font-weight:700; font-size:4mm; letter-spacing:.1em; color:#e7c988; margin-bottom:1.6mm; }
  .bx b{ color:#f1d9a0; font-weight:600; }
`;

function slotHtml(s) {
  // la cornice colorata sta FUORI dal rettangolo della carta (1mm), cosi' la carta vera entra esatta
  const G = 1.0;
  const frame = `<div class="fr" style="left:${s.x - G}mm; top:${s.y - G}mm; width:${s.w + 2 * G}mm; height:${s.h + 2 * G}mm; border:.7mm solid ${s.col}; box-shadow:0 0 2mm ${s.col}66;"></div>`;
  if (s.retro && s.retro.length === 1) {
    return frame + `<div class="cd" style="left:${s.x}mm; top:${s.y}mm; width:${s.w}mm; height:${s.h}mm;"><img src="${pathToFileURL(path.join(RETRO, s.retro[0] + '.png')).href}"></div>`;
  }
  if (s.retro) {   // piu' dorsi nello stesso slot (le tre scuole di Spell): a ventaglio, contenuti nello slot
    const n = s.retro.length;
    const imgs = s.retro.map((r, i) => {
      const rot = (i - (n - 1) / 2) * 8, dx = (i - (n - 1) / 2) * 8;
      return `<img src="${pathToFileURL(path.join(RETRO, r + '.png')).href}" style="position:absolute; left:${(s.w - s.w * 0.74) / 2 + dx}mm; top:${(s.h - s.h * 0.74) / 2}mm; width:${s.w * 0.74}mm; height:${s.h * 0.74}mm; object-fit:cover; transform:rotate(${rot}deg);">`;
    }).join('');
    return frame + `<div class="fan" style="position:absolute; left:${s.x}mm; top:${s.y}mm; width:${s.w}mm; height:${s.h}mm;">${imgs}</div>`;
  }
  return frame + `<div class="tx" style="left:${s.x}mm; top:${s.y}mm; width:${s.w}mm; height:${s.h}mm;"><div class="tn">${s.n}</div><div class="ts">${s.txt || ''}</div></div>`;
}
const boxHtml = b => `<div class="bx" style="left:${b.x}mm; top:${b.y}mm; width:${b.w}mm; height:${b.h}mm;"><div class="bh">${b.h1}</div><div>${b.body}</div></div>`;
const bgHtml = () => `<img class="bg" src="${pathToFileURL(BG).href}">`;

function pageHtml(shift, inner) {
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
    @page{ size:210mm 297mm; margin:0; }
    html,body{ width:210mm; height:297mm; background:#0a0d1c; }
    body{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .page{ position:relative; width:210mm; height:297mm; overflow:hidden; background:#0a0d1c; }
    ${CSS}
    .mat{ left:${shift}mm; }
  </style></head><body><div class="page"><div class="mat">${inner}</div></div></body></html>`;
}

function misure() {
  console.log('Verifica: gli slot devono stare dentro la cornice dello sfondo e nei margini di stampa (A4: ~5mm)');
  const FR = { l: 13, r: 407, t: 13.8, b: 279.4 };   // linea argento interna misurata sull'immagine
  let ok = true;
  for (const s of SLOTS) {
    const x0 = s.x - 1.7, y0 = s.y - 1.7, x1 = s.x + s.w + 1.7, y1 = s.y + s.h + 1.7;
    const sheet = x0 < 210 ? 'sx' : 'dx';
    const lx = sheet === 'sx' ? x0 : x0 - 210, rx = sheet === 'sx' ? x1 : x1 - 210;
    const cross = x0 < 210 && x1 > 210;
    const inFrame = x0 >= FR.l && x1 <= FR.r && y0 >= FR.t && y1 <= FR.b;
    const inMargin = lx >= PRINT_MARGIN && rx <= 210 - PRINT_MARGIN && y0 >= PRINT_MARGIN && y1 <= 297 - PRINT_MARGIN;
    if (cross || !inFrame || !inMargin) ok = false;
    console.log(s.n.padEnd(14), `${s.w}x${s.h}mm`.padEnd(11), `x ${s.x}..${(s.x + s.w).toFixed(1)}  y ${s.y}..${s.y + s.h}`.padEnd(30), `foglio ${sheet}`, cross ? ' ATTRAVERSA IL TAGLIO' : '', inFrame ? '' : ' FUORI CORNICE', inMargin ? '' : ' FUORI MARGINE STAMPA');
  }
  console.log(ok ? 'OK: tutti gli slot ci stanno.' : 'ATTENZIONE: qualcosa non ci sta.');
}

async function main() {
  if (process.argv.includes('misure')) return misure();
  fs.mkdirSync(OUT_PRINT, { recursive: true });
  fs.mkdirSync(OUT_ALTRO, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
  const mat = bgHtml() + SLOTS.map(slotHtml).join('') + BOXES.map(boxHtml).join('');
  const extra = bgHtml() + EXTRA.map(slotHtml).join('') +
    `<div class="tx" style="left:30mm; top:30mm; width:150mm; height:40mm;"><div class="tn" style="font-size:6mm">OGGETTI E SPELL</div><div class="ts" style="font-size:3.6mm">Mini-tappetino a parte, accanto al tabellone.</div></div>`;
  const jobs = [['sx', pageHtml(0, mat)], ['dx', pageHtml(-210, mat)], ['extra', pageHtml(0, extra)]];
  for (const [name, html] of jobs) {
    const tmp = path.join(__dirname, '_tmp-tabellone-' + name + '-' + Date.now() + '.html');
    fs.writeFileSync(tmp, html);
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
    await page.goto(pathToFileURL(tmp).href);
    await page.waitForTimeout(2200);
    await page.pdf({ path: path.join(OUT_PRINT, `tabellone_A4_${name}.pdf`), printBackground: true, preferCSSPageSize: true });
    await page.close(); fs.unlinkSync(tmp);
    console.log('Fatto: tabellone_A4_' + name);
  }
  // anteprima dei due fogli affiancati
  const both = path.join(__dirname, '_tmp-tabellone-both-' + Date.now() + '.html');
  const k = 96 / 25.4;
  fs.writeFileSync(both, `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>html,body{background:#0a0d1c} .w{position:relative;width:${420 * k}px;height:${297 * k}px;overflow:hidden} ${CSS} .mat{left:0}</style></head><body><div class="w"><div class="mat">${mat}</div></div></body></html>`);
  const pg = await browser.newPage({ viewport: { width: Math.round(420 * k), height: Math.round(297 * k) }, deviceScaleFactor: 1.5 });
  await pg.goto(pathToFileURL(both).href); await pg.waitForTimeout(2200);
  await pg.screenshot({ path: path.join(OUT_ALTRO, 'tabellone_A4_insieme.png') });
  await pg.close(); fs.unlinkSync(both);
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
