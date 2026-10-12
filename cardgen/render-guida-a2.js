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

const W = 2480, H = 1771, K = W / 406;           // px per mm
const FRAME = 14;                                 // spessore cornice sottile (mm)
const P = { w: 63.5, h: 88 }, T = { w: 120, h: 70 };
const PITCH = 71.5, COL = i => 203 + (i - 2) * PITCH - P.w / 2;    // 5 colonne: la centrale sta sulla giunzione
const R1 = 20, R2 = 114, R3 = 208;                // y delle tre file (alta: Poker, Poker, Tarocco)

// Logica di posizionamento (poli opposti): ARMONIA (ordine) a un estremo, ENTROPIA (caos) all'estremo opposto, sia
// in alto sia in basso; ELEMENTARE (fisico) ed ETEREI (spirito) nel mezzo, ai due lati della giunzione; GENERICO al
// centro (la base neutra); DEMONIACO e NON-MORTI, i due "scivolamenti" oscuri, insieme sul lato di Entropia,
// all'opposto di Armonia (che col Sacro e il Sole li annienta).
const TOP = [
  ...['ARMONIA', 'ELEMENTARE', 'GENERICO', 'ETEREI', 'ENTROPIA'].map((n, i) => ({ n, x: COL(i), y: R1, ...P })),
  { n: 'PROMEMORIA CHECK (testo mio)', x: COL(0), y: R2, ...P, soft: true },
  { n: 'PROMEMORIA TURNO (testo mio)', x: COL(1), y: R2, ...P, soft: true },
  { n: 'NON-MORTI', x: COL(3), y: R2, ...P },
  { n: 'DEMONIACO', x: COL(4), y: R2, ...P },
  { n: 'MAZZO PIANI', x: 143, y: R3, ...T, hot: true },
];
const BOTTOM = [
  // Piano corrente e Incontro attivo: ai due lati della giunzione (nessuna zona-carta la attraversa), vicini e in alto al centro
  { n: 'PIANO CORRENTE', x: 76, y: 21, ...T, hot: true },
  { n: 'INCONTRO ATTIVO', x: 210, y: 12, ...P, hot: true },
  // le due catene oscure insieme sul lato di Entropia (3 nodi ciascuna, le disegno io)
  { n: 'NON-MORTI (3 nodi)', x: 296, y: 12, w: 40, h: 88, soft: true },
  { n: 'DEMONIACO (3 nodi)', x: 342, y: 12, w: 40, h: 88, soft: true },
  // fila di 4 cluster: Armonia e Entropia agli estremi opposti, il taglio (x=203) fra Elementare e Eterei
  { n: 'ARMONIA (9 nodi)', x: 28, y: 108, w: 76, h: 146, soft: true },
  { n: 'ELEMENTARE (7 nodi)', x: 114, y: 108, w: 76, h: 146, soft: true },
  { n: 'ETEREI (5 nodi)', x: 216, y: 108, w: 76, h: 146, soft: true },
  { n: 'ENTROPIA (9 nodi)', x: 304, y: 108, w: 76, h: 146, soft: true },
  { n: 'SCALETTA 20 TACCHE (la disegno io)', x: 23, y: 258, w: 360, h: 16, soft: true },
];

function zoneHtml(z) {
  const col = z.hot ? '#f1c35a' : (z.soft ? '#78d0a0' : '#9fb3ff');
  return `<div style="position:absolute;left:${z.x * K}px;top:${z.y * K}px;width:${z.w * K}px;height:${z.h * K}px;border:3px dashed ${col};border-radius:14px;background:${z.soft ? 'rgba(120,208,160,.06)' : 'rgba(159,179,255,.07)'};display:flex;flex-direction:column;align-items:center;justify-content:center;color:${col};font:600 30px sans-serif;text-align:center;padding:8px">${z.n}${z.soft ? '' : `<span style="font:22px sans-serif;margin-top:8px;color:#bbb">${z.w}×${z.h}mm · lascia calmo e scuro</span>`}</div>`;
}
function page(kind) {
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
  await b.close();
})();
