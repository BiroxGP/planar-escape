// Tabellone da tavolo in due metà (sinistra / destra), ognuna su un A4 verticale ESATTO
// (210x297mm, a pieno foglio) cosi' che stampate una accanto all'altra combacino al centro.
// Le due immagini originali hanno proporzioni diverse dall'A4 (sx 1604x2528, dx 1637x2464):
// vengono adattate al foglio senza tagliare nulla (cornici e targhetta restano intere) con un
// leggero allargamento in orizzontale (sx +11%, dx +6%), uguale in altezza: cosi' le cornici
// in alto e in basso restano alla stessa quota sui due fogli e il bordo centrale si incontra.
// Tutti i testi sono posizionati in percentuale della pagina, quindi seguono l'immagine.
//
// Uso: node render-tabellone.js          -> cards_final/print/tabellone_sx.pdf / tabellone_dx.pdf
//                                           (+ anteprime in cards_final/altro/)
//      node render-tabellone.js debug    -> disegna anche i riquadri misurati, per ritoccarli
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const UI = path.join(__dirname, '..', 'assets', 'ui');
const OUT_PRINT = path.join(__dirname, '..', 'cards_final', 'print');
const OUT_ALTRO = path.join(__dirname, '..', 'cards_final', 'altro');
const DEBUG = process.argv[2] === 'debug';

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">`;

// Riquadri in frazione della pagina: [x0, y0, x1, y1]. Misurati sulle immagini.
const SX = {
  img: 'tabellone_sx.jpg',
  slots: [
    { r: [0.2427, 0.0980, 0.8140, 0.3180], t: 'MAZZO PIANI', s: 'Carte Piano coperte, si pesca dalla cima.<br>La destinazione è sempre casuale.' },
    { r: [0.2427, 0.3420, 0.8140, 0.5670], t: 'PIANO ATTUALE', s: 'Il Piano appena pescato: applica subito il suo effetto. Sotto, i piani già visitati (scarti).' },
    { r: [0.3743, 0.5940, 0.6817, 0.8480], t: 'INCONTRO', s: 'La carta Incontro del turno.<br>d6 = 6: si pesca dal Generico.' },
  ],
  gaps: [
    { r: [0.2427, 0.3180, 0.8140, 0.3420], t: '▼ si salta' },
    { r: [0.2427, 0.5670, 0.8140, 0.5940], t: '▼ poi l\'Incontro' },
  ],
  boxes: [
    { r: [0.1300, 0.6150, 0.3600, 0.8300], h: 'CHECK', body: 'Tira <b>1d6</b>: riesce se è <b>≤ al tuo valore</b>, oppure con un <b>6</b>.<br><br>Check di gruppo: un tiro solo, vale il valore più alto.' },
    { r: [0.7000, 0.6150, 0.9600, 0.8300], h: 'IL TURNO', body: '<b>1</b> Salta<br><b>2</b> Effetto del piano<br><b>3</b> Incontro<br><b>4</b> Fine turno<br><br>Ogni <b>5 salti</b>: livello.' },
  ],
  plaque: { r: [0.3550, 0.9000, 0.7050, 0.9550], t: 'IL VIAGGIO' },
};
const DX = {
  img: 'tabellone_dx.jpg',
  slots: (() => {
    const cx = [[0.0647, 0.3220], [0.3424, 0.5997], [0.6208, 0.8774]];
    const ry = [[0.1005, 0.3380], [0.3565, 0.5950], [0.6150, 0.8635]];
    const labels = [
      ['DEMONIACO', 'Incontri · 12 carte<br>Gironi infernali'],
      ['ARMONIA', 'Incontri · 15 carte<br>Ordine, Legge, Sacro'],
      ['ENTROPIA', 'Incontri · 15 carte<br>Caos, Tempo, Vuoto'],
      ['ELEMENTARE', 'Incontri · 15 carte<br>Fuoco, Acqua, Veleno'],
      ['OGGETTI', '60 carte<br>Mazzo unico: non si rimescola'],
      ['NON-MORTI', 'Incontri · 12 carte<br>Il Piano Negativo'],
      ['GENERICO', 'Incontri · 14 carte<br>Con un 6 sul d6, da ogni piano'],
      ['SPELL', '31 carte<br>Flusso · Essenza · Divinazione'],
      ['ETEREI', 'Incontri · 15 carte<br>Sogno, Specchi, Luce'],
    ];
    return labels.map((l, i) => ({ r: [cx[i % 3][0], ry[Math.floor(i / 3)][0], cx[i % 3][1], ry[Math.floor(i / 3)][1]], t: l[0], s: l[1] }));
  })(),
  gaps: [],
  boxes: [],
  plaque: { r: [0.3000, 0.9000, 0.6500, 0.9550], t: 'I MAZZI' },
};

function pct(v) { return (v * 100).toFixed(3) + '%'; }
function box(r) { return `left:${pct(r[0])}; top:${pct(r[1])}; width:${pct(r[2] - r[0])}; height:${pct(r[3] - r[1])};`; }

function pageHtml(cfg) {
  const slots = cfg.slots.map(s => `<div class="slot${DEBUG ? ' dbg' : ''}" style="${box(s.r)}"><div class="st">${s.t}</div><div class="ss">${s.s}</div></div>`).join('');
  const gaps = cfg.gaps.map(g => `<div class="gap${DEBUG ? ' dbg' : ''}" style="${box(g.r)}">${g.t}</div>`).join('');
  const boxes = cfg.boxes.map(b => `<div class="bx${DEBUG ? ' dbg' : ''}" style="${box(b.r)}"><div class="bh">${b.h}</div><div class="bb">${b.body}</div></div>`).join('');
  const pl = `<div class="plq${DEBUG ? ' dbg' : ''}" style="${box(cfg.plaque.r)}">${cfg.plaque.t}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
    @page{ size:210mm 297mm; margin:0; }
    *{box-sizing:border-box;margin:0;padding:0;}
    html,body{ width:210mm; height:297mm; background:#0b1020; }
    body{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .page{ position:relative; width:210mm; height:297mm; overflow:hidden; }
    .page img.bg{ position:absolute; left:0; top:0; width:100%; height:100%; display:block; }
    .slot{ position:absolute; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:0 7%; color:#e9dcc0; }
    .st{ font-family:'Cinzel',serif; font-weight:700; font-size:4.8mm; letter-spacing:.07em; white-space:nowrap; text-shadow:0 .3mm .8mm rgba(0,0,0,.9); }
    .ss{ margin-top:2mm; font-family:'Source Serif 4',serif; font-style:italic; font-size:3.1mm; line-height:1.3; color:#cdbf9f; text-shadow:0 .3mm .6mm rgba(0,0,0,.9); }
    .gap{ position:absolute; display:flex; align-items:center; justify-content:center; font-family:'JetBrains Mono',monospace; font-weight:700; font-size:2.6mm; letter-spacing:.08em; color:#b9a77c; text-transform:uppercase; }
    .bx{ position:absolute; padding:3mm 3.4mm; color:#e9dcc0; background:rgba(8,12,30,.62); border:.3mm solid rgba(201,161,90,.6); border-radius:2mm; font-family:'Source Serif 4',serif; font-size:3.3mm; line-height:1.3; }
    .bh{ font-family:'Cinzel',serif; font-weight:700; font-size:4mm; letter-spacing:.1em; color:#e7c988; margin-bottom:1.6mm; }
    .bx b{ color:#f1d9a0; font-weight:600; }
    .plq{ position:absolute; display:flex; align-items:center; justify-content:center; font-family:'Cinzel',serif; font-weight:700; font-size:5.4mm; letter-spacing:.14em; color:#3b2f1c; text-shadow:0 .25mm 0 rgba(255,244,214,.55); }
    .dbg{ outline:.4mm dashed rgba(255,60,60,.9); background:rgba(255,60,60,.08); }
  </style></head><body><div class="page"><img class="bg" src="${pathToFileURL(path.join(UI, cfg.img)).href}">${slots}${gaps}${boxes}${pl}</div></body></html>`;
}

async function main() {
  fs.mkdirSync(OUT_PRINT, { recursive: true });
  fs.mkdirSync(OUT_ALTRO, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
  for (const [name, cfg] of [['sx', SX], ['dx', DX]]) {
    const tmp = path.join(__dirname, '_tmp-tabellone-' + name + '-' + Date.now() + '.html');
    fs.writeFileSync(tmp, pageHtml(cfg));
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
    await page.goto('file://' + tmp);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT_ALTRO, `tabellone_${name}${DEBUG ? '_debug' : ''}.png`), clip: { x: 0, y: 0, width: 794, height: 1123 } });
    if (!DEBUG) await page.pdf({ path: path.join(OUT_PRINT, `tabellone_${name}.pdf`), printBackground: true, preferCSSPageSize: true });
    await page.close();
    fs.unlinkSync(tmp);
    console.log('Fatto: tabellone_' + name);
  }
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
