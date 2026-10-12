// Guide di layout per RIGENERARE i due sfondi del tabellone a 4 fogli (A2): una per la meta' alta, una per la bassa.
// Ogni immagine finale: 2480 x 1771 px = 406 x 290mm (6,108 px/mm). Le guide mostrano dove stanno le zone-carta
// (che nell'immagine devono restare CALME e scure: le cornici sottili le disegno io sopra, senza riempimento), la
// cornice sottile ai bordi esterni, la giunzione verticale (x=203mm) e il bordo aperto verso l'altra meta'.
// Le coordinate sono in mm sul tabellone montato (406x580): sono le stesse che userà render-tabellone-a2.js.
//
// Uso: node render-guida-a2.js -> cards_final/altro/tabellone_guida_alto.png / tabellone_guida_basso.png
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const W = 2480, H = 1771, KK = W / 406;          // px per mm (immagini a meta')
const FRAME = 14;                                 // spessore cornice sottile (mm)
const P = { w: 63.5, h: 88 }, T = { w: 120, h: 70 };
const PITCH = 71.5, COL = i => 203 + (i - 2) * PITCH - P.w / 2;    // 5 colonne: la centrale sta sulla giunzione
const R1 = 20, R2 = 114, R3 = 208;                // y delle tre file (alta: Poker, Poker, Tarocco)

// Layout approvato (prova del 12/10): mazzi per poli, Mazzo Piani a sinistra, Piano corrente + Incontro attivo vicini.
// Posizioni in mm sulla metà alta (y 0..290) e sulla metà bassa (y 0..290, poi +290 nella guida unica).
const ZT = [
  ...['ARMONIA', 'ELEMENTARE', 'GENERICO', 'ETEREI', 'ENTROPIA'].map((n, i) => ({ n, x: COL(i), y: 54, ...P })),
  { n: 'NON-MORTI', x: COL(3), y: 160, ...P },
  { n: 'DEMONIACO', x: COL(4), y: 160, ...P },
  { n: 'MAZZO PIANI', x: 28, y: 169, ...T, hot: true },
];
const TOP = ZT;
const BOTTOM = [
  { n: 'PIANO CORRENTE', x: 76, y: 31, ...T, hot: true },
  { n: 'INCONTRO ATTIVO', x: 210, y: 22, ...P, hot: true },
  { n: 'NON-MORTI (3 nodi)', x: 280, y: 20, w: 40, h: 88, soft: true },
  { n: 'DEMONIACO (3 nodi)', x: 324, y: 20, w: 40, h: 88, soft: true },
  { n: 'ARMONIA (9 nodi)', x: 28, y: 110, w: 76, h: 128, soft: true },
  { n: 'ELEMENTARE (7 nodi)', x: 114, y: 110, w: 76, h: 128, soft: true },
  { n: 'ETEREI (5 nodi)', x: 216, y: 110, w: 76, h: 128, soft: true },
  { n: 'ENTROPIA (9 nodi)', x: 304, y: 110, w: 76, h: 128, soft: true },
  { n: 'SCALETTA 20 TACCHE', x: 23, y: 240, w: 360, h: 28, soft: true },
];

function zoneHtml(z, K = KK) {
  const col = z.hot ? '#f1c35a' : (z.soft ? '#78d0a0' : '#9fb3ff');
  return `<div style="position:absolute;left:${z.x * K}px;top:${z.y * K}px;width:${z.w * K}px;height:${z.h * K}px;border:3px dashed ${col};border-radius:14px;background:${z.soft ? 'rgba(120,208,160,.06)' : 'rgba(159,179,255,.07)'};display:flex;flex-direction:column;align-items:center;justify-content:center;color:${col};font:600 30px sans-serif;text-align:center;padding:8px">${z.n}${z.soft ? '' : `<span style="font:22px sans-serif;margin-top:8px;color:#bbb">${z.w}×${z.h}mm · lascia calmo e scuro</span>`}</div>`;
}
function page(kind) {
  const K = KK;
  const isTop = kind === 'alto';
  const f = FRAME * K;
  const band = (css) => `<div style="position:absolute;${css};background:repeating-linear-gradient(45deg,rgba(200,170,90,.35) 0 10px,rgba(200,170,90,.12) 10px 20px);"></div>`;
  const frames = band(`left:0;top:0;width:${f}px;height:${H}px`) + band(`right:0;top:0;width:${f}px;height:${H}px`)
    + (isTop ? band(`left:0;top:0;width:${W}px;height:${f}px`) : band(`left:0;bottom:0;width:${W}px;height:${f}px`));
  const open = isTop ? `bottom:0` : `top:0`;
  const seamStrip = `<div style="position:absolute;left:${196 * K}px;top:0;width:${14 * K}px;height:${H}px;background:rgba(255,80,80,.10);border-left:2px dashed #ff6a6a;border-right:2px dashed #ff6a6a;"></div>
    <div style="position:absolute;left:${203 * K - 1}px;top:0;width:2px;height:${H}px;background:#ff6a6a"></div>
    <div style="position:absolute;left:${203 * K + 12}px;${isTop ? 'top:' + (H - 90) + 'px' : 'top:60px'};color:#ff8a8a;font:24px sans-serif;width:520px">giunzione verticale x=203mm: nella fascia rossa (196–210mm)<br>niente dettagli ad alto contrasto, niente teste/volti/rune nitide</div>`;
  const openEdge = `<div style="position:absolute;left:0;${open};width:${W}px;height:${18 * K}px;background:linear-gradient(${isTop ? '180deg' : '0deg'},rgba(0,0,0,0),rgba(120,160,255,.25));"></div>
    <div style="position:absolute;left:${24 * K}px;${isTop ? 'bottom:' + 10 + 'px' : 'top:10px'};color:#9db8ff;font:24px sans-serif;width:${W - 48 * K}px">BORDO APERTO: nessuna cornice qui, l'immagine sfuma in blu-notte quasi nero (#0b0f1e), uguale sull'altra metà</div>`;
  const legend = `<div style="position:absolute;left:${20 * K}px;top:${isTop ? 60 : 40}px;color:#ddd;font:26px sans-serif;width:${360 * K}px;display:none"></div>`;
  const zones = (isTop ? TOP : BOTTOM).map(zoneHtml).join('');
  const title = `<div style="position:absolute;left:${(isTop ? 20 : 24) * K}px;top:${isTop ? 4 : 270 * K}px;color:#eee;font:700 30px sans-serif;display:none"></div>`;
  return `<body style="margin:0;background:#0c1022"><div style="position:relative;width:${W}px;height:${H}px;background:radial-gradient(ellipse at 50% 50%,#1b2144,#0c1022);overflow:hidden">
    ${frames}${openEdge}${seamStrip}${zones}${legend}${title}
    <div style="position:absolute;right:${f + 30}px;${isTop ? 'top:' + (f + 20) : 'bottom:' + (f + 20)}px;color:#cdb778;font:24px sans-serif;text-align:right">fascia tratteggiata dorata = cornice sottile (${FRAME}mm = ${Math.round(FRAME * K)}px)<br>immagine ${W}×${H}px = 406×290mm · metà ${kind}</div>
  </div></body>`;
}

// ---- guida UNICA: un solo sfondo verticale 7:10 (1736 x 2480 px = 406 x 580mm) con le due meta' una sopra l'altra.
// Una sola immagine = una sola cornice, uguale ovunque; poi la taglio io in due meta' per i 4 fogli.
function pageUnica() {
  const UW = 1736, UH = 2480, K = UW / 406, f = FRAME * K;
  const band = (css) => `<div style="position:absolute;${css};background:repeating-linear-gradient(45deg,rgba(200,170,90,.35) 0 10px,rgba(200,170,90,.12) 10px 20px);"></div>`;
  const frames = band(`left:0;top:0;width:${f}px;height:${UH}px`) + band(`right:0;top:0;width:${f}px;height:${UH}px`) + band(`left:0;top:0;width:${UW}px;height:${f}px`) + band(`left:0;bottom:0;width:${UW}px;height:${f}px`);
  const vs = `<div style="position:absolute;left:${196 * K}px;top:0;width:${14 * K}px;height:${UH}px;background:rgba(255,80,80,.10);border-left:2px dashed #ff6a6a;border-right:2px dashed #ff6a6a;"></div>`;
  const hs = `<div style="position:absolute;left:0;top:${283 * K}px;width:${UW}px;height:${14 * K}px;background:rgba(255,80,80,.10);border-top:2px dashed #ff6a6a;border-bottom:2px dashed #ff6a6a;"></div>
    <div style="position:absolute;left:${24 * K}px;top:${290 * K - 14}px;color:#ff8a8a;font:24px sans-serif;">metà dei due sfondi (y=290mm): fascia rossa 283–297mm e 196–210mm = giunzioni dei fogli, niente dettagli forti, nessuna cornice qui</div>`;
  const zones = [...TOP, ...BOTTOM.map(z => ({ ...z, y: z.y + 290 }))].map(z => zoneHtml(z, K)).join('');
  return `<body style="margin:0;background:#0c1022"><div style="position:relative;width:${UW}px;height:${UH}px;background:radial-gradient(ellipse at 50% 50%,#1b2144,#0c1022);overflow:hidden">${frames}${vs}${hs}${zones}
    <div style="position:absolute;right:${f + 20}px;bottom:${f + 16}px;color:#cdb778;font:22px sans-serif;text-align:right">cornice sottile ovunque (${FRAME}mm = ${Math.round(f)}px) · immagine ${UW}×${UH}px = 406×580mm (7:10)</div></div></body>`;
}
(async () => {
  const outDir = path.join(__dirname, '..', 'cards_final', 'altro');
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM });
  for (const k of ['alto', 'basso']) {
    const f = path.join(__dirname, '_guida-' + k + '.html');
    fs.writeFileSync(f, page(k));
    const p = await b.newPage({ viewport: { width: W, height: H } });
    await p.goto(pathToFileURL(f).href); await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(outDir, `tabellone_guida_${k}.png`) });
    await p.close(); fs.unlinkSync(f);
    console.log('Fatto: tabellone_guida_' + k + '.png');
  }
  {
    const f = path.join(__dirname, '_guida-unica.html');
    fs.writeFileSync(f, pageUnica());
    const p = await b.newPage({ viewport: { width: 1736, height: 2480 } });
    await p.goto(pathToFileURL(f).href); await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(outDir, 'tabellone_guida_unica.png') });
    await p.close(); fs.unlinkSync(f);
    console.log('Fatto: tabellone_guida_unica.png');
  }
  await b.close();
})();
