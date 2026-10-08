// Pedine fisiche fornite dall'utente come foto/render intere (coniate su sfondo pieno,
// non pre-ritagliate): questo script le ritaglia a cerchio, le porta a dimensione reale
// di stampa, e produce i fogli PnP. La "pedina compagno" ha anche una finestra quadrata
// al centro dell'illustrazione (dove va appoggiato/infilato il dado fisico del compagno):
// la dimensione del token è dedotta da QUELLA finestra, non decisa a mano, così il dado
// ci sta per costruzione.
//
// Geometria misurata via script offline (canvas + edge-detection sui pixel, non a occhio
// come le altre pedine — qui l'errore sarebbe stato "il dado non entra"):
//  - pedina_risorsa_planare.jpg (2816x1536): moneta a schermo intero, centro (1408,765),
//    diametro ~1334px. L'utente ha confermato 2cm di diametro reale.
//  - pedina_compagno.jpg (2816x1536): moneta con finestra quadrata al centro, centro moneta
//    (1407,793), diametro moneta ~1443px; finestra quadrata ~347x345px (praticamente un
//    quadrato perfetto, centrata sulla moneta a meno di un paio di mm reali).
//
// Uso: node render-pedine.js
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const OUT_DIR = path.join(__dirname, '..', 'cards_final', 'pedine');
const PRINT_DIR = path.join(__dirname, '..', 'cards_final', 'print');
const UI_DIR = path.join(__dirname, '..', 'assets', 'ui');

const SRC_W = 2816, SRC_H = 1536;

// Dado fisico standard che deve entrare nella finestra della pedina compagno: 15mm, più
// un filo di gioco (1mm totale) per non doverlo incastrare a forza — è un piazzamento
// visivo, non un incastro di precisione.
const DIE_MM = 15;
const DIE_CLEARANCE_MM = 1;
const COMPAGNO_WINDOW_TARGET_MM = DIE_MM + DIE_CLEARANCE_MM;

const TOKENS = {
  risorsa: {
    src: path.join(UI_DIR, 'pedina_risorsa_planare.jpg'),
    center: [1408, 765],
    diameterPx: 1334,
    diameterMm: 20, // confermato dall'utente
    renderPx: 700,
    appIconPx: 200, // copia più leggera per l'app web
    backLabel: 'RISORSA',
    backAccent: '#c9932a', // oro, coerente con la moneta del fronte
    backFontSize: 100,
  },
  compagno: {
    src: path.join(UI_DIR, 'pedina_compagno.jpg'),
    center: [1407, 793],
    diameterPx: 1443,
    // finestra quadrata misurata (media dei due lati ~346px): il diametro reale della
    // moneta è quello che fa risultare la finestra larga COMPAGNO_WINDOW_TARGET_MM.
    windowPx: 346,
    get diameterMm() { return this.diameterPx * (COMPAGNO_WINDOW_TARGET_MM / this.windowPx); },
    renderPx: 900,
    backLabel: 'COMPAGNO',
    backAccent: '#8b5fbf', // viola, coerente col vortice del fronte
    backFontSize: 110,
  },
  // Pedina abilità di classe: due facce disegnate dall'utente (2752x1536 entrambe). Fronte =
  // abilità disponibile (moneta che brilla), retro = abilità usata (stessa moneta spenta).
  // Doppia delle pedine risorsa planare (40mm contro 20mm). Centro e diametro misurati sui
  // bordi della moneta (identici nelle due immagini).
  abilita_fronte: {
    src: path.join(UI_DIR, 'pedina_abilita_fronte.jpg'),
    srcW: 2752, srcH: 1536,
    center: [1371, 762],
    diameterPx: 1461,
    diameterMm: 40,
    renderPx: 900,
    centerText: ['ABILITÀ', 'PRONTA'], ink: '#4a3412',
  },
  abilita_retro: {
    src: path.join(UI_DIR, 'pedina_abilita_retro.jpg'),
    srcW: 2752, srcH: 1536,
    center: [1371, 762],
    diameterPx: 1461,
    diameterMm: 40,
    renderPx: 900,
    centerText: ['ABILITÀ', 'USATA'], ink: '#55555c',
  },
};

// Dorso: nessuna arte fornita per il retro (a differenza delle altre carte, che hanno
// sempre una foto "retro_<id>.jpg" pronta) — qui il dorso è generato di sana pianta in
// CSS, senza dipendere da altri file. Volutamente minimale (cerchio in tinta + un anello
// sottile + il nome): sono gettoni pensati per stare sempre a faccia in su, il dorso serve
// solo a riconoscerli quando sono ancora nel mucchio non tagliato.
function tokenBackHtml(key) {
  const t = TOKENS[key];
  const renderPx = t.renderPx;
  const ringInset = Math.round(renderPx * 0.06);
  return `<!doctype html><html><head><meta charset="utf-8">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&display=swap">
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{ background:transparent; }
    .token{
      position:relative; width:${renderPx}px; height:${renderPx}px; border-radius:50%; overflow:hidden;
      background:radial-gradient(circle at 50% 42%, color-mix(in srgb, ${t.backAccent} 55%, #1a1622) 0%, color-mix(in srgb, ${t.backAccent} 22%, #12101a) 62%, #0c0a12 100%);
    }
    .ring{
      position:absolute; inset:${ringInset}px; border-radius:50%;
      border:${Math.max(2, Math.round(renderPx * 0.006))}px solid color-mix(in srgb, ${t.backAccent} 65%, #f4ede0);
      opacity:.75;
    }
    .label{
      position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
      font-family:'Cinzel','GFS Baskerville','Liberation Serif',serif; font-weight:700;
      font-size:${t.backFontSize}px; letter-spacing:.06em; color:#f4ede0; text-align:center;
      text-shadow:0 0 ${Math.round(renderPx*.03)}px ${t.backAccent}, 0 0 ${Math.round(renderPx*.06)}px ${t.backAccent}, 0 2px 6px rgba(0,0,0,.8);
    }
  </style></head><body>
    <div class="token"><div class="ring"></div><div class="label">${t.backLabel}</div></div>
  </body></html>`;
}

function tokenHtml(key) {
  const t = TOKENS[key];
  const renderPx = t.renderPx;
  // scala uniforme applicata a entrambi gli assi: la sorgente NON è quadrata
  // (2816x1536, a differenza di segnalini.jpg che era 2048x2048) — usare un solo
  // bgSize per width e height qui stirerebbe l'immagine verticalmente.
  const scale = renderPx / t.diameterPx;
  const bgSizeW = (t.srcW || SRC_W) * scale, bgSizeH = (t.srcH || SRC_H) * scale;
  const bgPosX = -(t.center[0] - t.diameterPx / 2) * scale;
  const bgPosY = -(t.center[1] - t.diameterPx / 2) * scale;
  const url = pathToFileURL(t.src).href;
  const txt = t.centerText ? `<div class="ct"><div class="l1">${t.centerText[0]}</div><div class="rule"></div><div class="l2">${t.centerText[1]}</div></div>` : '';
  return `<!doctype html><html><head><meta charset="utf-8">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&display=swap">
  <style>
    *{margin:0;padding:0;}
    body{ background:transparent; }
    .token{
      position:relative; width:${renderPx}px; height:${renderPx}px; border-radius:50%; overflow:hidden;
      background-image:url(${url}); background-repeat:no-repeat;
      background-size:${bgSizeW}px ${bgSizeH}px; background-position:${bgPosX}px ${bgPosY}px;
    }
    .ct{ position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:'Cinzel',serif; font-weight:700; color:${t.ink||'#222'}; text-align:center; }
    .ct .l1{ font-size:${Math.round(renderPx*0.088)}px; letter-spacing:.05em; line-height:1; }
    .ct .rule{ width:${Math.round(renderPx*0.26)}px; height:${Math.max(2, Math.round(renderPx*0.004))}px; background:${t.ink||'#222'}; opacity:.55; margin:${Math.round(renderPx*0.022)}px 0; }
    .ct .l2{ font-size:${Math.round(renderPx*0.064)}px; letter-spacing:.14em; line-height:1; }
  </style></head><body><div class="token">${txt}</div></body></html>`;
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

function sheetHtml(pngFile, count, tokenMm, label, mirror) {
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
      // il retro va specchiato in orizzontale (fronte/retro sul lato lungo): le file NON piene (le
      // pedine rimaste da sole in fondo) stanno a sinistra sul fronte, quindi sul retro devono
      // stare a destra, altrimenti dopo il ribaltamento il dorso non cade dietro al fronte.
      const x0 = offsetXmm + col * (tokenMm + GAP_MM);
      const x = mirror ? PAGE_W_MM - x0 - tokenMm : x0;
      const y = offsetYmm + row * (tokenMm + GAP_MM);
      cells.push(`<div class="tok" style="left:${x}mm; top:${y}mm; width:${tokenMm}mm; height:${tokenMm}mm;"><img src="${url}"></div>`);
    }
    pages.push(`<div class="sheet">
      ${cells.join('\n')}
      <div class="ruler" style="left:${rulerX}mm;">
        <div class="ruler-bar"></div>
        ${ticks.map(m => `<i class="tick" style="left:${m}mm;"></i>`).join('')}
        <div class="ruler-label">${esc(label)} — righello di calibrazione: deve misurare esattamente ${RULER_MM}mm. Se non combacia, stampa a dimensione reale (100%), non "adatta alla pagina".</div>
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

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

async function renderPng(browser, html, outPath, sizePx) {
  const page = await browser.newPage({ viewport: { width: sizePx, height: sizePx } });
  const tmp = path.join(__dirname, '_tmp-pedine-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.html');
  fs.writeFileSync(tmp, html);
  await page.goto('file://' + tmp + '?t=' + Date.now());
  await page.waitForTimeout(700);
  await page.screenshot({ path: outPath, omitBackground: true });
  fs.unlinkSync(tmp);
  await page.close();
}

async function renderPdf(browser, html, outPath) {
  const page = await browser.newPage();
  const tmp = path.join(__dirname, '_tmp-pedine-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.html');
  fs.writeFileSync(tmp, html);
  await page.goto('file://' + tmp + '?t=' + Date.now());
  await page.pdf({ path: outPath, printBackground: true, width: `${PAGE_W_MM}mm`, height: `${PAGE_H_MM}mm`, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  fs.unlinkSync(tmp);
  await page.close();
}

// Foglio misto: le 5 pedine abilità (40mm) in testa, le pedine risorsa (20mm) a riempire
// il resto della pagina. Fronte e retro hanno disegni DIVERSI, quindi il retro si stampa con
// le posizioni specchiate in orizzontale (fronte/retro lungo il lato lungo), come le carte.
const MIX = { abilita: 5, risorsa: 15, reroll: 15, mod: 20 };
const ABILITA_COUNT = MIX.abilita;
function mixedLayout() {
  const AB = 40, RS = 20, SQ = 10, G = GAP_MM, GSQ = 4;
  const usableW = PAGE_W_MM - 2 * MARGIN_MM;
  const abCols = Math.max(1, Math.floor((usableW + G) / (AB + G)));   // 4
  const items = [];
  // 1) pedine abilità (40mm) in testa, a file da abCols
  for (let i = 0; i < MIX.abilita; i++) {
    items.push({ kind: 'abilita', d: AB, x: MARGIN_MM + (i % abCols) * (AB + G), y: MARGIN_MM + Math.floor(i / abCols) * (AB + G) });
  }
  const abRows = Math.ceil(MIX.abilita / abCols);
  // 2) pedine da 20mm (prima le risorse, poi i reroll): prima accanto all'ultima fila delle
  //    abilità (se non è piena), poi in una griglia piena sotto
  const small = [];
  for (let i = 0; i < MIX.risorsa; i++) small.push('risorsa');
  for (let i = 0; i < MIX.reroll; i++) small.push('reroll');
  let n = 0;
  const lastRowCount = MIX.abilita - (abRows - 1) * abCols;
  const lastRowY = MARGIN_MM + (abRows - 1) * (AB + G);
  if (lastRowCount < abCols) {
    const x0 = MARGIN_MM + lastRowCount * (AB + G);
    const yOff = (AB - RS) / 2;
    for (let x = x0; x + RS <= PAGE_W_MM - MARGIN_MM + 0.01 && n < small.length; x += RS + G) {
      items.push({ kind: small[n++], d: RS, x, y: lastRowY + yOff });
    }
  }
  let y = MARGIN_MM + abRows * (AB + G);
  const cols = Math.max(1, Math.floor((usableW + G) / (RS + G)));
  while (n < small.length) {
    for (let c = 0; c < cols && n < small.length; c++) items.push({ kind: small[n++], d: RS, x: MARGIN_MM + c * (RS + G), y });
    y += RS + G;
  }
  // 3) segnalini potenziamento/depotenziamento (quadrati da 10mm), file fitte sotto
  const sqCols = Math.max(1, Math.floor((usableW + GSQ) / (SQ + GSQ)));
  let m = 0;
  while (m < MIX.mod) {
    for (let c = 0; c < sqCols && m < MIX.mod; c++, m++) items.push({ kind: 'mod', d: SQ, square: true, x: MARGIN_MM + c * (SQ + GSQ), y });
    y += SQ + GSQ;
  }
  // centra orizzontalmente tutto il blocco nel margine utile
  const minLeft = Math.min(...items.map(it => it.x));
  const maxRight = Math.max(...items.map(it => it.x + it.d));
  const shift = ((PAGE_W_MM - 2 * MARGIN_MM) - (maxRight - minLeft)) / 2 - (minLeft - MARGIN_MM);
  items.forEach(it => { it.x += shift; });
  const bottom = Math.max(...items.map(it => it.y + it.d));
  if (bottom > PAGE_H_MM - MARGIN_MM) throw new Error('il foglio misto non entra in una pagina: ' + bottom.toFixed(1) + 'mm');
  return items;
}

function mixedSheetHtml(side, pngs, label) {
  const items = mixedLayout();
  const cells = items.map(it => {
    const x = side === 'retro' ? PAGE_W_MM - it.x - it.d : it.x;
    const src = pathToFileURL(pngs[it.kind][side]).href;
    return `<div class="tok${it.square ? ' sq' : ''}" style="left:${x}mm; top:${it.y}mm; width:${it.d}mm; height:${it.d}mm;"><img src="${src}"></div>`;
  });
  const ticks = []; for (let m = 0; m <= RULER_MM; m += 10) ticks.push(m);
  const rulerX = (PAGE_W_MM - RULER_MM) / 2;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{ background:#fff; }
    .sheet{ position:relative; width:${PAGE_W_MM}mm; height:${PAGE_H_MM}mm; }
    .tok{ position:absolute; border-radius:50%; box-shadow:0 0 0 .2mm #999; }
    .tok img{ display:block; width:100%; height:100%; border-radius:50%; }
    .tok.sq, .tok.sq img{ border-radius:0; }
    .ruler{ position:absolute; bottom:${MARGIN_MM - 8}mm; width:${RULER_MM}mm; left:${rulerX}mm; }
    .ruler-bar{ width:${RULER_MM}mm; height:.3mm; background:#000; }
    .ruler .tick{ position:absolute; top:-1mm; width:.3mm; height:2.3mm; background:#000; }
    .ruler-label{ margin-top:1.5mm; width:130mm; margin-left:${(RULER_MM - 130) / 2}mm; text-align:center; font-family:sans-serif; font-size:2.6mm; line-height:1.35; color:#333; }
  </style></head><body><div class="sheet">
    ${cells.join('\n')}
    <div class="ruler"><div class="ruler-bar"></div>${ticks.map(m => `<i class="tick" style="left:${m}mm;"></i>`).join('')}<div class="ruler-label">${esc(label)} — righello di calibrazione: deve misurare esattamente ${RULER_MM}mm. Se non combacia, stampa a dimensione reale (100%), non "adatta alla pagina".</div></div>
  </div></body></html>`;
}

async function mainAbilita() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PRINT_DIR, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const abF = path.join(OUT_DIR, 'pedina_abilita.png');
  const abR = path.join(OUT_DIR, 'pedina_abilita_retro.png');
  await renderPng(browser, tokenHtml('abilita_fronte'), abF, TOKENS.abilita_fronte.renderPx);
  await renderPng(browser, tokenHtml('abilita_retro'), abR, TOKENS.abilita_retro.renderPx);
  // le risorse servono come riempimento: stessi PNG già prodotti dal run completo, se mancano si rifanno
  const rsF = path.join(OUT_DIR, 'pedina_risorsa_planare.png');
  const rsR = path.join(OUT_DIR, 'pedina_risorsa_planare_retro.png');
  if (!fs.existsSync(rsF)) await renderPng(browser, tokenHtml('risorsa'), rsF, TOKENS.risorsa.renderPx);
  if (!fs.existsSync(rsR)) await renderPng(browser, tokenBackHtml('risorsa'), rsR, TOKENS.risorsa.renderPx);
  const rerollPng = path.join(OUT_DIR, 'pedina_reroll.png');
  const modF = path.join(__dirname, '..', 'cards_final', 'plancia', 'segnalino_modificatore.png');
  const modR = path.join(__dirname, '..', 'cards_final', 'plancia', 'segnalino_modificatore_retro.png');
  for (const f of [rerollPng, modF, modR]) if (!fs.existsSync(f)) throw new Error('manca ' + f + ': rigenera prima render-reroll-icon.js / render-plancia.js');
  const pngs = { abilita: { fronte: abF, retro: abR }, risorsa: { fronte: rsF, retro: rsR }, reroll: { fronte: rerollPng, retro: rerollPng }, mod: { fronte: modF, retro: modR } };
  const label = `Pedine: ${MIX.abilita} abilità 40mm, ${MIX.risorsa} risorsa planare 20mm, ${MIX.reroll} reroll 20mm, ${MIX.mod} potenziamento/depotenziamento 10mm`;
  await renderPdf(browser, mixedSheetHtml('fronte', pngs, label + ' — fronte'), path.join(PRINT_DIR, 'pedine_abilita_fronte.pdf'));
  await renderPdf(browser, mixedSheetHtml('retro', pngs, label + ' — retro'), path.join(PRINT_DIR, 'pedine_abilita_retro.pdf'));
  // anteprima PNG del foglio fronte e retro affiancati, per un controllo a colpo d'occhio
  for (const side of ['fronte', 'retro']) {
    const pg = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1.5 });
    const tmp = path.join(__dirname, '_tmp-abilita-' + side + '-' + Date.now() + '.html');
    fs.writeFileSync(tmp, mixedSheetHtml(side, pngs, label + ' — ' + side));
    await pg.goto('file://' + tmp);
    await pg.waitForTimeout(300);
    await pg.screenshot({ path: path.join(OUT_DIR, 'pedine_abilita_anteprima_' + side + '.png'), clip: { x: 0, y: 0, width: 794, height: 1123 } });
    fs.unlinkSync(tmp); await pg.close();
  }
  await browser.close();
  console.log(`Fatto: pedine_abilita_fronte/retro.pdf (${MIX.abilita} abilità, ${MIX.risorsa} risorse, ${MIX.reroll} reroll, ${MIX.mod} segnalini) in ${PRINT_DIR}`);
}

async function main() {
  if (process.argv[2] === 'abilita') return mainAbilita();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PRINT_DIR, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });

  // pedina risorsa planare: master fronte+retro di stampa + icona leggera per l'app web
  const risorsaPng = path.join(OUT_DIR, 'pedina_risorsa_planare.png');
  await renderPng(browser, tokenHtml('risorsa'), risorsaPng, TOKENS.risorsa.renderPx);
  const risorsaBackPng = path.join(OUT_DIR, 'pedina_risorsa_planare_retro.png');
  await renderPng(browser, tokenBackHtml('risorsa'), risorsaBackPng, TOKENS.risorsa.renderPx);
  const risorsaIconPng = path.join(UI_DIR, 'pedina_risorsa_planare_icon.png');
  await renderPng(browser, tokenHtml('risorsa'), risorsaIconPng, TOKENS.risorsa.appIconPx);

  // pedina compagno: fronte+retro di stampa (non usata nell'app)
  const compagnoPng = path.join(OUT_DIR, 'pedina_compagno.png');
  await renderPng(browser, tokenHtml('compagno'), compagnoPng, TOKENS.compagno.renderPx);
  const compagnoBackPng = path.join(OUT_DIR, 'pedina_compagno_retro.png');
  await renderPng(browser, tokenBackHtml('compagno'), compagnoBackPng, TOKENS.compagno.renderPx);

  // il dorso è identico per ogni pedina dello stesso tipo, ma la griglia del retro va comunque
  // specchiata: sulle file non piene le pedine restano a sinistra sul fronte e vanno a destra sul retro.
  await renderPdf(browser, sheetHtml(risorsaPng, 24, TOKENS.risorsa.diameterMm, 'Pedina Risorsa Planare, 20mm — fronte'), path.join(PRINT_DIR, 'pedine_risorsa_fronte.pdf'));
  await renderPdf(browser, sheetHtml(risorsaBackPng, 24, TOKENS.risorsa.diameterMm, 'Pedina Risorsa Planare, 20mm — retro', true), path.join(PRINT_DIR, 'pedine_risorsa_retro.pdf'));
  const compagnoMm = TOKENS.compagno.diameterMm;
  await renderPdf(browser, sheetHtml(compagnoPng, 8, compagnoMm, `Pedina Compagno, ${compagnoMm.toFixed(1)}mm (finestra ${COMPAGNO_WINDOW_TARGET_MM}mm per dado 15mm) — fronte`), path.join(PRINT_DIR, 'pedine_compagno_fronte.pdf'));
  await renderPdf(browser, sheetHtml(compagnoBackPng, 8, compagnoMm, `Pedina Compagno, ${compagnoMm.toFixed(1)}mm — retro`, true), path.join(PRINT_DIR, 'pedine_compagno_retro.pdf'));

  await browser.close();
  console.log('Fatto: pedina_risorsa_planare.png/_retro.png/_icon.png, pedina_compagno.png/_retro.png in ' + OUT_DIR + ' / ' + UI_DIR);
  console.log(`Fatto: pedine_risorsa_fronte/retro.pdf (20mm, 24 pedine) + pedine_compagno_fronte/retro.pdf (${compagnoMm.toFixed(1)}mm, 8 pedine) in ${PRINT_DIR}`);
}

main().catch(err => { console.error(err); process.exit(1); });
