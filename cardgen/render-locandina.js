// Locandina A4 da tavolo per i playtest: chi si siede a giocare e chi si ferma solo a guardare/leggere
// trova in una pagina cos'è il gioco, come funziona un turno e come si vince. Palette e font come il
// biglietto da visita (render-biglietto.js).
//
// Uso: node render-locandina.js
//   genera cards_final/altro/locandina.png (anteprima) e cards_final/print/locandina.pdf
//   (A4, 210x297mm). I testi sono nel dizionario T (una lingua per chiave, per ora solo it).
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const QRCode = require('qrcode');

const OUT_DIR = path.join(__dirname, '..', 'cards_final', 'altro');
const PRINT_DIR = path.join(__dirname, '..', 'cards_final', 'print');
const COVER = path.join(__dirname, '..', 'assets', 'ui', 'copertina.jpg');
const DEMO_URL = 'https://planar-escape.vercel.app/gioco';
const SITE_URL = 'https://planar-escape.vercel.app';

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">`;

const T = {
  it: {
    file: 'locandina',
    tagline: "Un ultimo respiro. Un portale. Un salto nell'ignoto.",
    lead: "Un gruppo di avventurieri sta per essere spazzato via da un nemico troppo forte. All'ultimo momento, <b>tenendosi per mano, apre un portale e fugge</b> senza sapere dove porti. Da lì è un salto continuo tra piani generati a caso, con un solo obiettivo: <b>tornare a casa</b>. Si collabora per sopravvivere, ma <b>vince ognuno per sé</b>.",
    turnH: 'Un turno in quattro mosse',
    steps: [
      ['1', 'Salta', 'Destinazione <b>a caso</b>. Nel portale il gruppo è un\'unica entità: arriva tutto insieme.'],
      ['2', 'Il piano', 'Ogni piano ha un suo effetto: fuoco, veleno, follia, tempo che si spezza.'],
      ['3', 'Incontro', 'Una carta: scontro, prova, mercante o ricompensa.'],
      ['4', 'Crescita', 'Ogni <b>5 salti</b>: +1 a una caratteristica e un potere di classe.'],
    ],
    diceH: 'Il dado',
    diceRule: 'Ogni prova si fa con <b>un d6</b>: riesce se il risultato è <b>minore o uguale al tuo valore</b>, oppure se esce un <b>6</b>, sempre.',
    fight: '<b>Scontro:</b> tutti tirano sulla stessa caratteristica e si confrontano i danni del giro: chi ne fa meno incassa la differenza.',
    statsH: 'Sei caratteristiche',
    stats: [['#c9573d', 'Forza', 'scontri fisici'], ['#4d8fc9', 'Intelletto', 'magia e conoscenza'], ['#5fb36a', 'Destrezza', 'schivare e fuggire'], ['#d8506b', 'Punti Vita', 'a 0 si sviene'], ['#a37bd6', 'Sanità', 'se crolla, Follia'], ['#e0b04a', 'Anima', 'se crolla, Corruzione']],
    famH: 'Sette famiglie di piani',
    fams: [['🔥', 'Elementare', 'Fuoco, Acqua, Veleno, Tempesta…'], ['🌋', 'Terrestre', 'Età della Terra Antica, Flora Aliena'], ['👹', 'Demoniaco', 'Tre gironi infernali sempre più duri'], ['☠️', 'Non-morti', 'Il Piano Negativo, che logora la mente'], ['🌙', 'Eterei', 'Sogno, Specchi, Luce, Tenebre…'], ['✨', 'Armonia', 'Ordine, Legge, Logica, Verità…'], ['🌀', 'Entropia', 'Caos, Tempo, Vuoto, Oblio…']],
    classes: '13 classi: Guerriero, Mago, Ladro, Druido, Monaco…',
    winH: 'Come si vince',
    win: 'Non si torna a casa per scelta: serve la fortuna di <b>pescare la Via di Casa</b> tra le destinazioni leggendarie del Piano Terreno. Si lascia il gruppo? Il bottino è tutto tuo, ma sei solo.',
    demo: 'PROVA LA DEMO',
    foot1: 'Planar Escape · prototipo in playtest',
    foot2: 'Instagram / TikTok @planar.escape',
  },
};

// facce del d6 disegnate con CSS: pallini sulla griglia 3x3
function dieFace(n) {
  const pos = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] }[n];
  return `<div class="die">${Array.from({ length: 9 }, (_, i) => `<i${pos.includes(i + 1) ? ' class="on"' : ''}></i>`).join('')}</div>`;
}

async function html(lang) {
  const L = T[lang];
  const cover = pathToFileURL(COVER).href;
  const qr = await QRCode.toDataURL(DEMO_URL, { margin: 1, width: 500, color: { dark: '#1c1524', light: '#f4ecdc' } });
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
    @page{ size:210mm 297mm; margin:0; }
    *{box-sizing:border-box;margin:0;padding:0;}
    html,body{ background:#140f1a; }
    body{ font-family:'Source Serif 4',Georgia,serif; color:#f4ecdc; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .sheet{ position:relative; width:210mm; height:297mm; overflow:hidden;
      background: radial-gradient(ellipse 160mm 110mm at 85% 38%, rgba(184,135,74,.16), transparent 62%), linear-gradient(160deg,#241a2e 0%,#1a1322 55%,#140f1a 100%); }
    .gold{ color:#e7c988; }

    /* --- hero --- */
    .hero{ position:relative; height:61mm; background:url(${cover}) center 34%/cover; }
    .hero::after{ content:''; position:absolute; inset:0; background:linear-gradient(to top, rgba(20,15,26,1) 0%, rgba(20,15,26,.78) 30%, rgba(20,15,26,.15) 70%, rgba(20,15,26,.35) 100%); }
    .hero .txt{ position:absolute; left:14mm; right:14mm; bottom:5mm; z-index:2; }
    .title{ font-family:'Cinzel',serif; font-weight:700; font-size:13mm; letter-spacing:.06em; line-height:1;
      background:linear-gradient(90deg,#f1d9a0,#c9954f); -webkit-background-clip:text; background-clip:text; color:transparent;
      filter:drop-shadow(0 .5mm 1mm rgba(0,0,0,.7)); }
    .tag{ margin-top:2.2mm; font-style:italic; font-size:5.2mm; color:#f4ecdc; text-shadow:0 .4mm 1.2mm rgba(0,0,0,.9); }

    .pad{ padding:0 14mm; }
    h2{ font-family:'Cinzel',serif; font-weight:700; font-size:5.2mm; letter-spacing:.08em; text-transform:uppercase; color:#e7c988; display:flex; align-items:center; gap:3mm; }
    h2::after{ content:''; flex:1; height:.3mm; background:linear-gradient(90deg,#c9a15a,transparent); }

    .lead{ margin-top:4mm; font-size:4.25mm; line-height:1.36; }
    .lead b{ color:#f1d9a0; }

    /* --- turno --- */
    .sec{ margin-top:4.2mm; }
    .steps{ margin-top:3mm; display:grid; grid-template-columns:repeat(4,1fr); gap:3mm; }
    .step{ background:rgba(244,236,220,.06); border:.3mm solid rgba(201,161,90,.45); border-radius:2mm; padding:2.6mm 3mm 2.8mm; position:relative; }
    .step .n{ font-family:'Cinzel',serif; font-weight:700; font-size:7mm; line-height:.9; color:#c9a15a; opacity:.95; }
    .step .hd{ display:flex; align-items:baseline; gap:2mm; }
    .step .t{ font-family:'Cinzel',serif; font-weight:700; font-size:4.4mm; line-height:1.15; color:#f9f3e6; }
    .step .d{ margin-top:1.4mm; font-size:3.55mm; line-height:1.3; color:#e6dccb; }
    .step .d b{ color:#f1d9a0; }

    /* --- dado + scontri --- */
    .two{ margin-top:4.2mm; display:grid; grid-template-columns:1.05fr 1fr; gap:6mm; }
    .box{ margin-top:2.6mm; background:rgba(244,236,220,.06); border:.3mm solid rgba(201,161,90,.45); border-radius:2mm; padding:3.6mm 4mm; }
    .rule{ display:flex; gap:4mm; align-items:center; }
    .die{ flex:none; width:17mm; height:17mm; background:#f4ecdc; border-radius:2.6mm; padding:2mm; display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:repeat(3,1fr); box-shadow:0 .6mm 1.4mm rgba(0,0,0,.5); }
    .die i{ display:block; width:3mm; height:3mm; margin:auto; border-radius:50%; }
    .die i.on{ background:#241a2e; }
    .rule .r{ font-size:4.2mm; line-height:1.28; }
    .rule .r b{ color:#f1d9a0; }
    .sub{ margin-top:3.2mm; font-size:3.7mm; line-height:1.32; color:#e6dccb; }
    .sub b{ color:#f1d9a0; }
    .stats{ margin-top:2.6mm; display:grid; gap:1.1mm; }
    .stat{ display:flex; align-items:center; gap:2.8mm; }
    .stat .dot{ flex:none; width:4.4mm; height:4.4mm; border-radius:50%; box-shadow:0 0 0 .5mm rgba(244,236,220,.25); }
    .stat .nm{ font-family:'Cinzel',serif; font-weight:700; font-size:4mm; color:#f9f3e6; width:25mm; flex:none; }
    .stat .ds{ font-size:3.45mm; color:#e0d6c4; line-height:1.15; }

    /* --- piani --- */
    .fam{ margin-top:2.6mm; display:grid; grid-template-columns:repeat(4,1fr); gap:2.6mm; }
    .f{ background:rgba(244,236,220,.06); border:.3mm solid rgba(201,161,90,.35); border-radius:2mm; padding:2.4mm 2.8mm; }
    .f .h{ display:flex; align-items:center; gap:1.8mm; font-family:'Cinzel',serif; font-weight:700; font-size:3.9mm; color:#f9f3e6; }
    .f .h span{ font-size:5mm; line-height:1; }
    .f .x{ margin-top:.9mm; font-size:3.15mm; line-height:1.22; color:#d9cfbd; }
    .f.note{ border-style:dashed; display:flex; align-items:center; font-style:italic; font-size:3.4mm; line-height:1.25; color:#e7c988; }

    /* --- classi --- */
    .cls{ margin-top:3mm; display:flex; flex-wrap:wrap; gap:1.8mm 2mm; }
    .c{ display:flex; align-items:center; gap:1.4mm; background:rgba(244,236,220,.08); border-radius:99px; padding:.9mm 3mm .9mm 1.9mm; font-size:3.5mm; color:#f4ecdc; }
    .c span{ font-size:4mm; line-height:1; }

    /* --- vittoria + QR --- */
    .bottom{ position:absolute; left:14mm; right:14mm; bottom:10mm; display:grid; grid-template-columns:1fr 30mm; gap:6mm; align-items:end; }
    .win{ font-size:4mm; line-height:1.33; }
    .win p{ margin-top:2mm; }
    .win b{ color:#f1d9a0; }
    .qr{ text-align:center; }
    .qr img{ width:30mm; height:30mm; border-radius:2mm; display:block; box-shadow:0 .8mm 2mm rgba(0,0,0,.5); }
    .qr .l{ margin-top:1.4mm; font-family:'JetBrains Mono',monospace; font-weight:700; font-size:3mm; color:#f2d18f; line-height:1.2; }
    .foot{ position:absolute; left:14mm; right:14mm; bottom:3.2mm; display:flex; justify-content:space-between; font-family:'JetBrains Mono',monospace; font-size:2.6mm; color:#a99b85; }
  </style></head><body>
  <div class="sheet">
    <div class="hero"><div class="txt">
      <div class="title">PLANAR ESCAPE</div>
      <div class="tag">${L.tagline}</div>
    </div></div>

    <div class="pad">
      <p class="lead">${L.lead}</p>

      <div class="sec">
        <h2>${L.turnH}</h2>
        <div class="steps">${L.steps.map(st => `<div class="step"><div class="hd"><div class="n">${st[0]}</div><div class="t">${st[1]}</div></div><div class="d">${st[2]}</div></div>`).join('')}</div>
      </div>

      <div class="two">
        <div>
          <h2>${L.diceH}</h2>
          <div class="box">
            <div class="rule">${dieFace(6)}<div class="r">${L.diceRule}</div></div>
            <p class="sub">${L.fight}</p>
          </div>
        </div>
        <div>
          <h2>${L.statsH}</h2>
          <div class="stats">${L.stats.map(s => `<div class="stat"><i class="dot" style="background:${s[0]}"></i><span class="nm">${s[1]}</span><span class="ds">${s[2]}</span></div>`).join('')}</div>
        </div>
      </div>

      <div class="sec">
        <h2>${L.famH}</h2>
        <div class="fam">${L.fams.map(f => `<div class="f"><div class="h"><span>${f[0]}</span>${f[1]}</div><div class="x">${f[2]}</div></div>`).join('')}
          <div class="f note">${L.classes}</div></div>
      </div>

    </div>

    <div class="bottom">
      <div class="win">
        <h2>${L.winH}</h2>
        <p>${L.win}</p>
      </div>
      <div class="qr"><img src="${qr}"><div class="l">${L.demo}</div></div>
    </div>
    <div class="foot"><span>${L.foot1}</span><span>${L.foot2}</span></div>
  </div></body></html>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PRINT_DIR, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
  for (const lang of Object.keys(T)) {
    const tmp = path.join(__dirname, '_tmp-locandina-' + lang + '-' + Date.now() + '.html');
    fs.writeFileSync(tmp, await html(lang));
    const png = path.join(OUT_DIR, T[lang].file + '.png');
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2.5 });
    await page.goto('file://' + tmp);
    await page.waitForTimeout(1200); // web font da Google Fonts
    await page.screenshot({ path: png, clip: { x: 0, y: 0, width: 794, height: 1123 } });
    await page.pdf({ path: path.join(PRINT_DIR, T[lang].file + '.pdf'), printBackground: true, preferCSSPageSize: true });
    await page.close();
    fs.unlinkSync(tmp);
    console.log('Fatto:', T[lang].file);
  }
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
