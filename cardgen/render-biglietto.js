// Biglietto da visita di Planar Escape — fronte (dati di contatto + QR IG/TikTok, ricreato
// da un mockup di riferimento fornito dall'utente) e retro (immagine di copertina della
// home page + tagline "Un ultimo respiro..."). Formato UE standard 85x55mm.
//
// Uso: node render-biglietto.js
//   genera cards_final/altro/biglietto_fronte.png, biglietto_retro.png,
//   cards_final/print/biglietto_fronte.pdf / _retro.pdf (griglia per la stampa multi-copia,
//   fronte/retro allineati con la stessa logica a colonne specchiate di print-pnp.js).
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const QRCode = require('qrcode');

const CARD_W = 1004, CARD_H = 650; // 85x55mm a ~11.81px/mm (300dpi equivalente)
const OUT_DIR = path.join(__dirname, '..', 'cards_final', 'altro');
const PRINT_DIR = path.join(__dirname, '..', 'cards_final', 'print');
const COVER = path.join(__dirname, '..', 'assets', 'ui', 'copertina.jpg');
const AVATAR = path.join(__dirname, '..', 'assets', 'ui', 'avatar_instagram.jpg'); // foto profilo Instagram @planar.escape

const IG_URL = 'https://www.instagram.com/planar.escape/';
const TT_URL = 'https://www.tiktok.com/@planar.escape';

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Source+Serif+4:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`;

function cornerMarks() {
  // piccoli mirini decorativi negli angoli della cornice (L + pallino), puramente
  // decorativi — non hanno a che fare con i crop mark funzionali usati per la stampa.
  const corners = [
    { cls: 'tl', top: 20, left: 20 },
    { cls: 'tr', top: 20, right: 20 },
    { cls: 'bl', bottom: 20, left: 20 },
    { cls: 'br', bottom: 20, right: 20 },
  ];
  return corners.map(c => {
    const pos = Object.entries(c).filter(([k]) => k !== 'cls').map(([k, v]) => `${k}:${v}px;`).join('');
    const hLine = (c.cls[1] === 'l') ? 'left:0;' : 'right:0;';
    const vLine = (c.cls[0] === 't') ? 'top:0;' : 'bottom:0;';
    return `<div class="corner" style="${pos}">
      <i style="position:absolute; ${hLine} top:0; width:14px; height:1.5px; background:#c9a15a;"></i>
      <i style="position:absolute; ${vLine} left:0; width:1.5px; height:14px; background:#c9a15a;"></i>
    </div>`;
  }).join('');
}

async function frontHtml() {
  const igQr = await QRCode.toDataURL(IG_URL, { margin: 1, width: 400, color: { dark: '#241a2e', light: '#f4ecdc' } });
  const ttQr = await QRCode.toDataURL(TT_URL, { margin: 1, width: 400, color: { dark: '#241a2e', light: '#f4ecdc' } });
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{ background:#0c0810; }
    .card{
      position:relative; width:${CARD_W}px; height:${CARD_H}px; overflow:hidden;
      background:
        radial-gradient(ellipse 620px 420px at 82% 18%, rgba(184,135,74,.28), transparent 60%),
        linear-gradient(135deg, #2a1f35 0%, #1c1524 55%, #140f1a 100%);
      color:#f4ecdc; font-family:'Source Serif 4',Georgia,serif;
    }
    .frame{ position:absolute; inset:28px; border:1.5px solid #c9a15a; }
    .corner{ position:absolute; width:16px; height:16px; }
    .title{
      position:absolute; left:56px; top:64px; right:56px;
      font-family:'Cinzel',serif; font-weight:700; font-size:50px; letter-spacing:.07em;
      background:linear-gradient(90deg,#e7c988,#b8874a); -webkit-background-clip:text; background-clip:text; color:transparent;
    }
    .tagline{
      position:absolute; left:58px; top:150px;
      font-style:italic; font-size:21px; color:#e6d7b2; text-shadow:0 1px 3px rgba(0,0,0,.4);
    }
    .tagline-rule{ position:absolute; left:58px; top:188px; width:290px; height:1px; background:#c9a15a; opacity:.6; }
    .contact{ position:absolute; left:58px; top:216px; }
    .contact .name{ font-size:24px; font-weight:600; color:#f9f3e6; }
    .contact .role{ font-style:italic; font-size:16px; font-weight:500; color:#d6c9b8; margin-top:6px; }
    .contact .mono{ font-family:'JetBrains Mono',monospace; font-weight:500; font-size:16px; letter-spacing:.015em; color:#f2d18f; margin-top:12px; text-shadow:0 1px 2px rgba(0,0,0,.35); }
    .igrow{ position:absolute; left:58px; top:428px; display:flex; align-items:center; gap:18px; }
    .igrow .av{ width:84px; height:84px; border-radius:50%; object-fit:cover; transform:scale(1.04); box-shadow:0 0 0 1.5px #c9a15a; }
    .igrow span{ font-family:'JetBrains Mono',monospace; font-weight:500; font-size:19px; letter-spacing:.02em; color:#f2d18f; text-shadow:0 1px 2px rgba(0,0,0,.35); }
    .qrblock{ position:absolute; right:40px; top:70px; text-align:center; display:flex; gap:22px; }
    .qrcol{ width:114px; }
    .qrcol .lbl{ font-family:'Cinzel',serif; font-weight:500; font-size:13px; letter-spacing:.1em; color:#f9f3e6; margin-bottom:8px; }
    .qrcol img{ width:114px; height:114px; border-radius:6px; box-shadow:0 3px 10px rgba(0,0,0,.45); display:block; }
    .qrcap{ position:absolute; right:40px; top:264px; width:250px; text-align:center; font-family:'JetBrains Mono',monospace; font-size:13px; color:#d6c9b8; }
  </style></head><body>
    <div class="card">
      <div class="frame"></div>
      ${cornerMarks()}
      <div class="title">PLANAR ESCAPE</div>
      <div class="tagline">Un salto disperato tra piani infiniti.</div>
      <div class="tagline-rule"></div>
      <div class="contact">
        <div class="name">Gabriele Pieralli</div>
        <div class="role">Ideatore &amp; Game Designer</div>
        <div class="mono">planarescape@gmail.com</div>
        <div class="mono">planar-escape.vercel.app</div>
      </div>
      <div class="igrow"><img class="av" src="${pathToFileURL(AVATAR).href}"><span>@planar.escape</span></div>
      <div class="qrblock">
        <div class="qrcol"><div class="lbl">INSTAGRAM</div><img src="${igQr}"></div>
        <div class="qrcol"><div class="lbl">TIKTOK</div><img src="${ttQr}"></div>
      </div>
      <div class="qrcap">@planar.escape (IG + TikTok)</div>
    </div>
  </body></html>`;
}

function backHtml() {
  const url = pathToFileURL(COVER).href;
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{ background:#0c0810; }
    .card{
      position:relative; width:${CARD_W}px; height:${CARD_H}px; overflow:hidden;
      background-image:url(${url}); background-size:cover; background-position:center 38%;
    }
    .overlay{
      position:absolute; left:0; right:0; bottom:0; top:0;
      background:linear-gradient(to top, rgba(10,7,13,.97) 0%, rgba(10,7,13,.82) 42%, rgba(10,7,13,.4) 68%, transparent 100%);
    }
    .text{ position:absolute; left:48px; right:48px; bottom:34px; }
    .tagline{
      font-family:'Cinzel',serif; font-size:42px; line-height:1.22; letter-spacing:.02em; color:#f9f3e6;
      text-shadow:0 2px 4px rgba(0,0,0,.9), 0 4px 16px rgba(0,0,0,.75);
    }
    .subtagline{ margin-top:10px; font-family:'Source Serif 4',Georgia,serif; font-style:italic; font-size:19px; color:#e7ddce; text-shadow:0 2px 4px rgba(0,0,0,.85), 0 3px 12px rgba(0,0,0,.7); }
    .brand{ position:absolute; left:48px; top:32px; font-family:'Cinzel',serif; font-weight:700; font-size:22px; letter-spacing:.12em; color:#f9f3e6; text-shadow:0 2px 4px rgba(0,0,0,.85), 0 3px 10px rgba(0,0,0,.7); }
  </style></head><body>
    <div class="card">
      <div class="overlay"></div>
      <div class="brand">PLANAR ESCAPE</div>
      <div class="text">
        <div class="tagline">Un ultimo respiro.<br>Un portale. Un salto nell'ignoto.</div>
        <div class="subtagline">Planar Escape — la fuga non è mai la fine della storia.</div>
      </div>
    </div>
  </body></html>`;
}

const PAGE_W_MM = 210, PAGE_H_MM = 297, MARGIN_MM = 10;
const CARD_W_MM = 85, CARD_H_MM = 55;
const RULER_MM = 40;

function buildGrid() {
  const usableW = PAGE_W_MM - 2 * MARGIN_MM;
  const usableH = PAGE_H_MM - 2 * MARGIN_MM - 22; // striscia per il righello
  const cols = Math.floor(usableW / CARD_W_MM);
  const rows = Math.floor(usableH / CARD_H_MM);
  const gridW = cols * CARD_W_MM, gridH = rows * CARD_H_MM;
  const offsetXmm = (PAGE_W_MM - gridW) / 2;
  const offsetYmm = MARGIN_MM + (usableH - gridH) / 2;
  return { cols, rows, offsetXmm, offsetYmm };
}

function printSheetHtml(pngPath, mirror, label) {
  const { cols, rows, offsetXmm, offsetYmm } = buildGrid();
  const url = pathToFileURL(pngPath).href;
  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const drawCol = mirror ? (cols - 1 - col) : col;
      const x = offsetXmm + drawCol * CARD_W_MM;
      const y = offsetYmm + row * CARD_H_MM;
      cells.push(`<div class="cell" style="left:${x}mm; top:${y}mm; width:${CARD_W_MM}mm; height:${CARD_H_MM}mm;"><img src="${url}"><i class="crop tl"></i><i class="crop tr"></i><i class="crop bl"></i><i class="crop br"></i></div>`);
    }
  }
  const ticks = []; for (let m = 0; m <= RULER_MM; m += 10) ticks.push(m);
  const rulerX = (PAGE_W_MM - RULER_MM) / 2;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{ background:#fff; }
    .sheet{ position:relative; width:${PAGE_W_MM}mm; height:${PAGE_H_MM}mm; }
    .cell{ position:absolute; }
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
    .ruler-label{ margin-top:1.5mm; width:120mm; margin-left:${(RULER_MM - 120) / 2}mm; text-align:center; font-family:sans-serif; font-size:2.6mm; line-height:1.35; color:#333; }
  </style></head><body><div class="sheet">
    ${cells.join('\n')}
    <div class="ruler"><div class="ruler-bar"></div>${ticks.map(m => `<i class="tick" style="left:${m}mm;"></i>`).join('')}<div class="ruler-label">${label} — righello di calibrazione: deve misurare esattamente ${RULER_MM}mm. Se non combacia, stampa a dimensione reale (100%), non "adatta alla pagina".</div></div>
  </div></body></html>`;
}

async function renderPng(browser, html, outPath) {
  const page = await browser.newPage({ viewport: { width: CARD_W, height: CARD_H } });
  const tmp = path.join(__dirname, '_tmp-biglietto-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.html');
  fs.writeFileSync(tmp, html);
  await page.goto('file://' + tmp + '?t=' + Date.now());
  await page.waitForTimeout(500); // tempo per il caricamento dei web font da Google Fonts
  const el = await page.$('.card');
  await el.screenshot({ path: outPath });
  fs.unlinkSync(tmp);
  await page.close();
}

async function renderPdf(browser, html, outPath) {
  const page = await browser.newPage();
  const tmp = path.join(__dirname, '_tmp-biglietto-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.html');
  fs.writeFileSync(tmp, html);
  await page.goto('file://' + tmp + '?t=' + Date.now());
  await page.pdf({ path: outPath, printBackground: true, width: `${PAGE_W_MM}mm`, height: `${PAGE_H_MM}mm`, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  fs.unlinkSync(tmp);
  await page.close();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PRINT_DIR, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });

  const frontPng = path.join(OUT_DIR, 'biglietto_fronte.png');
  const backPng = path.join(OUT_DIR, 'biglietto_retro.png');
  await renderPng(browser, await frontHtml(), frontPng);
  await renderPng(browser, backHtml(), backPng);

  const label = 'Biglietto da visita, 85x55mm';
  await renderPdf(browser, printSheetHtml(frontPng, false, `${label} — fronte`), path.join(PRINT_DIR, 'biglietto_fronte.pdf'));
  await renderPdf(browser, printSheetHtml(backPng, true, `${label} — retro`), path.join(PRINT_DIR, 'biglietto_retro.pdf'));
  // un unico PDF a 2 pagine (1 = fronti, 2 = retri specchiati) da stampare fronte/retro in un colpo solo
  {
    const f = printSheetHtml(frontPng, false, `${label} — fronte (pagina 1)`);
    const r = printSheetHtml(backPng, true, `${label} — retro (pagina 2)`);
    const sheetR = r.slice(r.indexOf('<div class="sheet">'), r.lastIndexOf('</div></body>') + '</div>'.length);
    const both = f.replace('</style>', '.sheet + .sheet{ page-break-before:always; }</style>').replace('</div></body>', '</div>' + sheetR + '</body>');
    await renderPdf(browser, both, path.join(PRINT_DIR, 'biglietti_fronte_retro.pdf'));
  }

  await browser.close();
  console.log('Fatto:', frontPng);
  console.log('Fatto:', backPng);
  console.log('Fatto: biglietto_fronte.pdf / _retro.pdf in', PRINT_DIR);
}
main().catch(e => { console.error(e); process.exit(1); });
