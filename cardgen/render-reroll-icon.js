// Icona reroll: l'utente ha fornito reroll.png (1601x1601, disegno chiaro su sfondo nero
// pieno, non davvero trasparente nonostante "sfondo trasparente" nel messaggio — stesso caso
// di segnalini.jpg). Composta su un cerchio in tinta con mix-blend-mode:screen (il nero
// sparisce, resta solo il disegno chiaro), stessa tecnica già usata per segnalini e pedine.
//
// Due output:
//  - icona per l'app web (200px, stessa risoluzione di pedina_risorsa_planare_icon.png)
//  - pedina fisica da stampare, 20mm come la pedina Risorsa Planare (stessa "famiglia" di
//    gettoni) — fronte e retro IDENTICI (stessa icona su entrambi, richiesto dall'utente:
//    a differenza del segnalino modificatore non c'è nessuna informazione diversa da dare
//    sul retro, quindi niente specchiatura della griglia, ininfluente per un disegno uguale).
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const SRC = path.join(__dirname, '..', 'assets', 'ui', 'reroll.png');
const UI_DIR = path.join(__dirname, '..', 'assets', 'ui');
const OUT_DIR = path.join(__dirname, '..', 'cards_final', 'pedine');
const PRINT_DIR = path.join(__dirname, '..', 'cards_final', 'print');
// Le 24 pedine da 20mm non riempiono il foglio A4 (restano ~4 righe su 11 usate): la carta
// "Scala delle Ricompense" (formato Poker, 63,5x88mm — vedi render-scala-ricompense.js, va
// rigenerata PRIMA di questo script) entra comodamente nello spazio avanzato sotto la griglia,
// invece di stampare un foglio A4 a parte per una sola carta.
const SCALA_PNG = path.join(__dirname, '..', 'cards_final', 'altro', 'scala_ricompense.png');
const SCALA_W_MM = 63.5, SCALA_H_MM = 88;

const ICON_PX = 200;   // icona app, come pedina_risorsa_planare_icon.png
const PRINT_PX = 700;  // master di stampa, come pedina_risorsa_planare.png
const TOKEN_MM = 20;   // stessa dimensione fisica della pedina Risorsa Planare

const BG = '#1c3a4a';   // blu/petrolio scuro, diverso dall'oro della risorsa planare per distinguerle a colpo d'occhio
const BORDER = '#7fb8c9'; // anello chiaro coerente col disegno stesso

function iconHtml(sizePx) {
  const url = pathToFileURL(SRC).href;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;}
    body{ background:transparent; }
    .icon{
      position:relative; width:${sizePx}px; height:${sizePx}px; border-radius:50%; overflow:hidden;
      background:radial-gradient(circle at 50% 42%, color-mix(in srgb, ${BORDER} 30%, ${BG}) 0%, ${BG} 70%, #0c1a20 100%);
      box-shadow:inset 0 0 0 ${Math.max(2, Math.round(sizePx*.02))}px color-mix(in srgb, ${BORDER} 65%, #f4ede0);
    }
    .art{
      position:absolute; inset:${Math.round(sizePx*.08)}px;
      background-image:url(${url}); background-size:contain; background-repeat:no-repeat; background-position:center;
      mix-blend-mode:screen;
    }
  </style></head><body><div class="icon"><div class="art"></div></div></body></html>`;
}

const PAGE_W_MM = 210, PAGE_H_MM = 297, MARGIN_MM = 12, GAP_MM = 5;
const RULER_MM = 40;

function buildGrid(tokenMm) {
  const usableW = PAGE_W_MM - 2 * MARGIN_MM;
  const usableH = PAGE_H_MM - 2 * MARGIN_MM;
  const cols = Math.max(1, Math.floor((usableW + GAP_MM) / (tokenMm + GAP_MM)));
  const rows = Math.max(1, Math.floor((usableH + GAP_MM) / (tokenMm + GAP_MM)));
  const gridW = cols * tokenMm + (cols - 1) * GAP_MM;
  const gridH = rows * tokenMm + (rows - 1) * GAP_MM;
  const offsetXmm = (PAGE_W_MM - gridW) / 2;
  const offsetYmm = MARGIN_MM + (usableH - gridH) / 2;
  return { cols, rows, offsetXmm, offsetYmm };
}

function sheetHtml(pngFile, count, tokenMm, label, extraCard) {
  const { cols, rows, offsetXmm, offsetYmm } = buildGrid(tokenMm);
  const perPage = cols * rows;
  const url = pathToFileURL(pngFile).href;
  const pageCount = Math.ceil(count / perPage);
  const ticks = []; for (let m = 0; m <= RULER_MM; m += 10) ticks.push(m);
  const rulerX = (PAGE_W_MM - RULER_MM) / 2;
  const pages = [];
  for (let p = 0; p < pageCount; p++) {
    const n = Math.min(perPage, count - p * perPage);
    const cells = [];
    for (let i = 0; i < n; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const x = offsetXmm + col * (tokenMm + GAP_MM);
      const y = offsetYmm + row * (tokenMm + GAP_MM);
      cells.push(`<div class="tok" style="left:${x}mm; top:${y}mm; width:${tokenMm}mm; height:${tokenMm}mm;"><img src="${url}"></div>`);
    }
    // solo sull'ultima pagina, nello spazio avanzato sotto la griglia dei gettoni.
    const extraHtml = (extraCard && p === pageCount - 1) ? `<div class="extra-card" style="left:${extraCard.x}mm; top:${extraCard.y}mm; width:${extraCard.w}mm; height:${extraCard.h}mm;">
        <img src="${pathToFileURL(extraCard.src).href}">
        <i class="crop tl"></i><i class="crop tr"></i><i class="crop bl"></i><i class="crop br"></i>
      </div>` : '';
    pages.push(`<div class="sheet">
      ${cells.join('\n')}
      ${extraHtml}
      <div class="ruler" style="left:${rulerX}mm;">
        <div class="ruler-bar"></div>
        ${ticks.map(m => `<i class="tick" style="left:${m}mm;"></i>`).join('')}
        <div class="ruler-label">${label} — righello di calibrazione: deve misurare esattamente ${RULER_MM}mm. Se non combacia, stampa a dimensione reale (100%), non "adatta alla pagina".</div>
      </div>
    </div>`);
  }
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{ background:#fff; }
    .sheet{ position:relative; width:${PAGE_W_MM}mm; height:${PAGE_H_MM}mm; page-break-after:always; }
    .tok{ position:absolute; border-radius:50%; box-shadow:0 0 0 .2mm #999; }
    .tok img{ display:block; width:100%; height:100%; border-radius:50%; }
    .extra-card{ position:absolute; }
    .extra-card img{ display:block; width:100%; height:100%; }
    .extra-card .crop{ position:absolute; display:block; }
    .extra-card .crop.tl{ left:-3.5mm; top:0; width:3mm; height:.25mm; background:#999; }
    .extra-card .crop.tl::after{ content:''; position:absolute; left:0; top:-3.5mm; width:.25mm; height:3mm; background:#999; }
    .extra-card .crop.tr{ right:-3.5mm; top:0; width:3mm; height:.25mm; background:#999; }
    .extra-card .crop.tr::after{ content:''; position:absolute; right:0; top:-3.5mm; width:.25mm; height:3mm; background:#999; }
    .extra-card .crop.bl{ left:-3.5mm; bottom:0; width:3mm; height:.25mm; background:#999; }
    .extra-card .crop.bl::after{ content:''; position:absolute; left:0; bottom:-3.5mm; width:.25mm; height:3mm; background:#999; }
    .extra-card .crop.br{ right:-3.5mm; bottom:0; width:3mm; height:.25mm; background:#999; }
    .extra-card .crop.br::after{ content:''; position:absolute; right:0; bottom:-3.5mm; width:.25mm; height:3mm; background:#999; }
    .ruler{ position:absolute; bottom:${MARGIN_MM - 8}mm; width:${RULER_MM}mm; }
    .ruler-bar{ width:${RULER_MM}mm; height:.3mm; background:#000; }
    .ruler .tick{ position:absolute; top:-1mm; width:.3mm; height:2.3mm; background:#000; }
    .ruler-label{ margin-top:1.5mm; width:110mm; margin-left:${(RULER_MM - 110) / 2}mm; text-align:center; font-family:sans-serif; font-size:2.6mm; line-height:1.35; color:#333; }
  </style></head><body>${pages.join('\n')}</body></html>`;
}

async function renderPng(browser, html, outPath, sizePx) {
  const page = await browser.newPage({ viewport: { width: sizePx, height: sizePx } });
  const tmp = path.join(__dirname, '_tmp-reroll-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.html');
  fs.writeFileSync(tmp, html);
  await page.goto('file://' + tmp + '?t=' + Date.now());
  await page.waitForTimeout(200);
  await page.screenshot({ path: outPath, omitBackground: true });
  fs.unlinkSync(tmp);
  await page.close();
}

async function renderPdf(browser, html, outPath) {
  const page = await browser.newPage();
  const tmp = path.join(__dirname, '_tmp-reroll-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.html');
  fs.writeFileSync(tmp, html);
  await page.goto('file://' + tmp + '?t=' + Date.now());
  await page.pdf({ path: outPath, printBackground: true, width: `${PAGE_W_MM}mm`, height: `${PAGE_H_MM}mm`, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  fs.unlinkSync(tmp);
  await page.close();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PRINT_DIR, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });

  // icona app (invariata rispetto a prima)
  await renderPng(browser, iconHtml(ICON_PX), path.join(UI_DIR, 'reroll_icon.png'), ICON_PX);

  // pedina fisica: un solo master, usato identico per fronte e retro
  const printPng = path.join(OUT_DIR, 'pedina_reroll.png');
  await renderPng(browser, iconHtml(PRINT_PX), printPng, PRINT_PX);

  const label = `Pedina Reroll, ${TOKEN_MM}mm`;
  // posizione della carta extra nello spazio avanzato sotto la griglia dei gettoni (righe 0-3
  // di 11 occupate, vedi calcolo in testa al file) — centrata in orizzontale, ben sopra il
  // righello di calibrazione in fondo alla pagina.
  const hasScala = fs.existsSync(SCALA_PNG);
  const extraX = (PAGE_W_MM - SCALA_W_MM) / 2;
  const extraY = 150;
  const extraCardFront = hasScala ? { src: SCALA_PNG, x: extraX, y: extraY, w: SCALA_W_MM, h: SCALA_H_MM } : null;
  // fronte e retro sono la stessa immagine (nessun retro dedicato per questa carta), ma va
  // comunque specchiata in X sul foglio retro: a differenza delle pedine (24 copie identiche,
  // dove non importa quale fronte si accoppia a quale retro) qui la carta è unica, quindi senza
  // specchiare il suo retro finirebbe stampato nella posizione sbagliata della pagina fisica.
  const extraCardBack = hasScala ? { ...extraCardFront, x: PAGE_W_MM - extraX - SCALA_W_MM } : null;
  if (!hasScala) console.log('ATTENZIONE: cards_final/altro/scala_ricompense.png non trovato — esegui prima node render-scala-ricompense.js. Procedo senza.');

  await renderPdf(browser, sheetHtml(printPng, 24, TOKEN_MM, `${label} — fronte`, extraCardFront), path.join(PRINT_DIR, 'pedine_reroll_fronte.pdf'));
  await renderPdf(browser, sheetHtml(printPng, 24, TOKEN_MM, `${label} — retro (stessa icona del fronte)`, extraCardBack), path.join(PRINT_DIR, 'pedine_reroll_retro.pdf'));

  await browser.close();
  console.log('Fatto: assets/ui/reroll_icon.png, ' + printPng);
  console.log('Fatto: pedine_reroll_fronte.pdf / _retro.pdf (24 pedine da ' + TOKEN_MM + 'mm, fronte e retro identici' + (hasScala ? ' + carta Scala delle Ricompense nello spazio avanzato' : '') + ') in ' + PRINT_DIR);
}
main().catch(err => { console.error(err); process.exit(1); });
