// Carta di riferimento per i giocatori: "scala dei premi" di Contesa, in base al valore
// massimo delle entità sconfitte (vedi grantCombatReward in gioco.html). Sfondo fornito
// dall'utente (assets/ui/scala_ricompense.jpg, 2048x2048, 5 pannelli luminosi impilati,
// dal più luminoso/valore 5 in alto al più tenue/valore 1 in basso) — i bordi dei pannelli
// sono stati misurati con uno script di supporto (pixel scan sulla colonna centrale) invece
// di essere stimati a occhio, stesso approccio già usato per i gettoni fisici.
//
// L'icona oggetto è una miniatura del retro della carta Oggetto (cards_final/retro/retro_oggetto.png,
// lo stesso dorso usato per l'intero mazzo Oggetti), non un'emoji — su richiesta esplicita, per
// restare coerente con l'iconografia delle altre carte fisiche invece di un simbolo generico.
// Le icone di caratteristica temporanea/permanente non esistevano: qui sono disegnate come SVG
// inline — anello tratteggiato (temporanea, "si consuma") vs anello pieno con perno (permanente,
// "resta"), stessa freccia ↑ dentro a entrambe per restare leggibili anche in stampa piccola.
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const CARD_W = 750, CARD_H = 1039; // stesse dimensioni di PORTRAIT_CARD_W/H in template.js
const OUT_DIR = path.join(__dirname, '..', 'cards_final', 'altro');
const PRINT_DIR = path.join(__dirname, '..', 'cards_final', 'print');
const BG = path.join(__dirname, '..', 'assets', 'ui', 'scala_ricompense.jpg');
const ITEM_BACK = path.join(__dirname, '..', 'cards_final', 'retro', 'retro_oggetto.png');

// pannelli misurati sull'immagine sorgente 2048x2048 (scan pixel, vedi cardgen/_measure-scala.js),
// convertiti in coordinate della carta (scala 1039/2048): dal più luminoso (valore 5) al più
// tenue (valore 1).
const SCALE = CARD_H / 2048;
const rows = [
  { value: 5, yTop: 170, yBot: 484, items: 2, stat: 'perm', statN: 2 },
  { value: 4, yTop: 524, yBot: 828, items: 1, stat: 'perm', statN: 1 },
  { value: 3, yTop: 868, yBot: 1180, items: 1, stat: 'temp', statN: 1 },
  { value: 2, yTop: 1220, yBot: 1516, items: 1, stat: null, statN: 0 },
  { value: 1, yTop: 1520, yBot: 1880, items: 0, stat: 'temp', statN: 1 },
].map(r => ({ ...r, y0: r.yTop * SCALE, y1: r.yBot * SCALE }));

// lo sfondo (quadrato 2048x2048) viene adattato con background-size:cover a una carta più
// stretta che alta: la scala è vincolata dall'altezza, quindi ai lati viene ritagliato
// (2048*SCALE - CARD_W)/2 px di larghezza (in coordinate carta) — va sottratto, altrimenti
// le coordinate dei pannelli restano quelle dell'immagine intera, non quelle visibili.
const CROP_EACH_SIDE = (2048 * SCALE - CARD_W) / 2;
const PANEL_X0 = 793 * SCALE - CROP_EACH_SIDE, PANEL_X1 = 1252 * SCALE - CROP_EACH_SIDE; // 258..491 circa

function statIcon(kind, size) {
  // anello tratteggiato = temporanea (svanisce al Recupero) · anello pieno con perno in
  // basso = permanente (resta per sempre) · stessa freccia ↑ dentro a entrambe.
  const r = size / 2 - 4;
  const ring = kind === 'perm'
    ? `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#2b1a10" stroke-width="5"/>
       <circle cx="${size / 2}" cy="${size - 6}" r="4" fill="#2b1a10"/>`
    : `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#2b1a10" stroke-width="5" stroke-dasharray="7 6"/>`;
  const cx = size / 2, cy = size / 2;
  const arrow = `<path d="M ${cx} ${cy - r * 0.55} L ${cx - r * 0.4} ${cy + r * 0.15} L ${cx - r * 0.18} ${cy + r * 0.15} L ${cx - r * 0.18} ${cy + r * 0.5} L ${cx + r * 0.18} ${cy + r * 0.5} L ${cx + r * 0.18} ${cy + r * 0.15} L ${cx + r * 0.4} ${cy + r * 0.15} Z" fill="#2b1a10"/>`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${ring}${arrow}</svg>`;
}

function rowHtml(r) {
  const h = r.y1 - r.y0;
  const iconSize = 56;
  const itemUrl = pathToFileURL(ITEM_BACK).href;
  const chips = [];
  for (let i = 0; i < r.items; i++) chips.push(`<span class="chip chip-item"><img src="${itemUrl}" style="height:${iconSize}px;"></span>`);
  for (let i = 0; i < r.statN; i++) chips.push(`<span class="chip">${statIcon(r.stat, iconSize)}</span>`);
  return `<div class="valuecol" style="top:${r.y0}px; height:${h}px;"><span>${r.value}</span></div>
  <div class="row" style="top:${r.y0}px; height:${h}px;">
    <div class="chips">${chips.join('')}</div>
  </div>`;
}

function pageHtml() {
  const bgUrl = pathToFileURL(BG).href;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{ background:#0c0806; }
    .card{
      position:relative; width:${CARD_W}px; height:${CARD_H}px; overflow:hidden;
      font-family:Georgia,'Times New Roman',serif; color:#2b1a10;
      background-image:url(${bgUrl}); background-size:cover; background-position:center;
    }
    .title{
      position:absolute; top:22px; left:0; right:0; text-align:center;
      color:#f3e2bf; text-shadow:0 2px 6px rgba(0,0,0,.6);
      font-size:30px; letter-spacing:.06em; font-weight:700;
    }
    .subtitle{
      position:absolute; top:60px; left:0; right:0; text-align:center;
      color:#d8c093; text-shadow:0 2px 5px rgba(0,0,0,.6);
      font-size:15px; font-style:italic;
    }
    .valuecol{
      position:absolute; left:0; width:${PANEL_X0}px;
      display:flex; align-items:center; justify-content:center;
    }
    .valuecol span{
      font-size:88px; font-weight:700; line-height:1; color:#f3e2bf;
      text-shadow:0 3px 8px rgba(0,0,0,.7);
    }
    .row{
      position:absolute; left:${PANEL_X0}px; width:${PANEL_X1 - PANEL_X0}px;
      box-sizing:border-box; padding:0 14px;
      display:flex; align-items:center; justify-content:center;
    }
    .chips{ display:flex; align-items:center; justify-content:center; gap:14px; flex-wrap:wrap; }
    .chip{ line-height:1; display:flex; align-items:center; justify-content:center; }
    .chip svg{ display:block; }
    .chip-item img{ display:block; border-radius:4px; box-shadow:0 2px 6px rgba(0,0,0,.5); }
    .footer{
      position:absolute; bottom:16px; left:20px; right:20px; text-align:center;
      color:#d8c093; text-shadow:0 2px 5px rgba(0,0,0,.6);
      font-size:13px; font-style:italic; line-height:1.35;
    }
  </style></head><body>
    <div class="card">
      <div class="title">Scala delle Ricompense</div>
      <div class="subtitle">Valore massimo dell'entità sconfitta</div>
      ${rows.map(rowHtml).join('\n')}
      <div class="footer">Caratteristica sempre legata alla nativa del piano.<br>Oggetto a chi ne ha meno, bonus a chi ha la caratteristica più bassa.</div>
    </div>
  </body></html>`;
}

const PAGE_W_MM = 210, PAGE_H_MM = 297, MARGIN_MM = 10;
const CARD_W_MM = 63.5, CARD_H_MM = 88;
const RULER_MM = 40;

function printSheetHtml(pngPath, label) {
  const usableW = PAGE_W_MM - 2 * MARGIN_MM;
  const usableH = PAGE_H_MM - 2 * MARGIN_MM - 25;
  const x = (PAGE_W_MM - CARD_W_MM) / 2;
  const y = MARGIN_MM + (usableH - CARD_H_MM) / 2;
  const url = pathToFileURL(pngPath).href;
  const ticks = []; for (let m = 0; m <= RULER_MM; m += 10) ticks.push(m);
  const rulerX = (PAGE_W_MM - RULER_MM) / 2;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{ background:#fff; }
    .sheet{ position:relative; width:${PAGE_W_MM}mm; height:${PAGE_H_MM}mm; }
    .cell{ position:absolute; left:${x}mm; top:${y}mm; width:${CARD_W_MM}mm; height:${CARD_H_MM}mm; }
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
    .ruler{ position:absolute; left:${rulerX}mm; bottom:${MARGIN_MM - 3}mm; width:${RULER_MM}mm; }
    .ruler-bar{ width:${RULER_MM}mm; height:.3mm; background:#000; }
    .ruler .tick{ position:absolute; top:-1mm; width:.3mm; height:2.3mm; background:#000; }
    .ruler-label{ margin-top:1.5mm; width:100mm; margin-left:${(RULER_MM - 100) / 2}mm; text-align:center; font-family:sans-serif; font-size:2.6mm; line-height:1.35; color:#333; }
  </style></head><body><div class="sheet">
    <div class="cell"><img src="${url}"><i class="crop tl"></i><i class="crop tr"></i><i class="crop bl"></i><i class="crop br"></i></div>
    <div class="ruler"><div class="ruler-bar"></div>${ticks.map(m => `<i class="tick" style="left:${m}mm;"></i>`).join('')}<div class="ruler-label">${label} — righello di calibrazione: deve misurare esattamente ${RULER_MM}mm. Se non combacia, stampa a dimensione reale (100%), non "adatta alla pagina".</div></div>
  </div></body></html>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PRINT_DIR, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });

  const page = await browser.newPage({ viewport: { width: CARD_W + 40, height: CARD_H + 40 } });
  const tmp = path.join(__dirname, '_tmp-scala.html');
  fs.writeFileSync(tmp, pageHtml());
  await page.goto('file://' + tmp + '?t=' + Date.now());
  await page.waitForTimeout(300);
  const el = await page.$('.card');
  const outPng = path.join(OUT_DIR, 'scala_ricompense.png');
  await el.screenshot({ path: outPng });
  fs.unlinkSync(tmp);

  const printPage = await browser.newPage();
  const tmp2 = path.join(__dirname, '_tmp-scala-print.html');
  fs.writeFileSync(tmp2, printSheetHtml(outPng, 'Scala delle Ricompense (carta di riferimento)'));
  await printPage.goto('file://' + tmp2 + '?t=' + Date.now());
  await printPage.pdf({ path: path.join(PRINT_DIR, 'scala_ricompense.pdf'), printBackground: true, width: `${PAGE_W_MM}mm`, height: `${PAGE_H_MM}mm`, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  fs.unlinkSync(tmp2);

  await browser.close();
  console.log('Fatto:', outPng);
  console.log('Fatto:', path.join(PRINT_DIR, 'scala_ricompense.pdf'));
}
main().catch(e => { console.error(e); process.exit(1); });
