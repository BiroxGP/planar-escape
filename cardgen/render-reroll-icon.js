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

function sheetHtml(pngFile, count, tokenMm, label) {
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
    pages.push(`<div class="sheet">
      ${cells.join('\n')}
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
  await renderPdf(browser, sheetHtml(printPng, 24, TOKEN_MM, `${label} — fronte`), path.join(PRINT_DIR, 'pedine_reroll_fronte.pdf'));
  await renderPdf(browser, sheetHtml(printPng, 24, TOKEN_MM, `${label} — retro (stessa icona del fronte)`), path.join(PRINT_DIR, 'pedine_reroll_retro.pdf'));

  await browser.close();
  console.log('Fatto: assets/ui/reroll_icon.png, ' + printPng);
  console.log('Fatto: pedine_reroll_fronte.pdf / _retro.pdf (24 pedine da ' + TOKEN_MM + 'mm, fronte e retro identici) in ' + PRINT_DIR);
}
main().catch(err => { console.error(err); process.exit(1); });
