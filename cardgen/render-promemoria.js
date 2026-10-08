// Promemoria del giocatore: foglio A4 fronte/retro da tenere al tavolo durante i playtest.
// Fronte = come si gioca (turno, check, scontro, Follia/Corruzione...), retro = le 13 classi
// (dati presi da classes-data.json, quindi sempre allineati al gioco). Fondo chiaro: costa meno
// inchiostro e si legge meglio di una pagina scura usata a lungo.
//
// Uso: node render-promemoria.js  ->  cards_final/print/promemoria.pdf (2 pagine) +
//   cards_final/altro/promemoria_fronte.png / promemoria_retro.png (anteprime)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const CLASSES = require('./classes-data.json');

const OUT_DIR = path.join(__dirname, '..', 'cards_final', 'altro');
const PRINT_DIR = path.join(__dirname, '..', 'cards_final', 'print');

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">`;

// ogni blocco: titolo, righe (stringhe con <b> ammesso)
const BLOCKS_LEFT = [
  ['Il turno', [
    '<b>1 · Salto.</b> Si pesca la carta Piano in cima al mazzo. Il gruppo salta unito: nel portale è un\'unica entità, quindi la meta è la stessa per tutti. I gruppi possono anche essere <b>separati</b>: ognuno ha il proprio turno (salto, piano, Incontro), e i turni si fanno <b>uno alla volta</b>.',
    '<b>2 · Il piano.</b> Si applica il suo effetto d\'ingresso. Alcuni piani colpiscono a <b>fine turno</b> (Veleno, Tempesta, gironi più bassi del Piano Negativo).',
    '<b>3 · Incontro.</b> Si tira un d6: con <b>6</b> la carta arriva dal mazzo Generico, altrimenti da quello della famiglia del piano.',
    '<b>4 · Fine turno.</b> Scattano gli effetti di fine turno, poi si salta di nuovo. Ogni <b>5 salti</b>: livello, +1 a una caratteristica e un potere di classe.',
  ]],
  ['Check', [
    'Tira <b>1d6</b>: riesce se il risultato è <b>≤ al tuo valore</b> in quella caratteristica, oppure se esce un <b>6</b>. Le caratteristiche vanno da 1 a 5 (6 con un bonus temporaneo).',
    '<b>Check di gruppo:</b> un solo tiro per tutti, col valore <b>più alto</b> presente. I reroll personali non si usano mai sui check di gruppo.',
  ]],
  ['Scontro (Contesa)', [
    'Tutti i personaggi tirano sulla <b>stessa caratteristica</b> indicata dalla carta; ogni nemico tira per sé. Un colpo a segno di un personaggio infligge <b>1 danno</b> (alcune armi e capacità di più) e un 6 naturale è sempre a segno. Un nemico colpisce se tira ≤ al suo valore (per lui un 6 è sempre un fallimento) e fa tanto danno quant\'è il suo valore, che è anche il suo numero di <b>PV</b>.',
    'A fine giro si <b>sommano i danni</b> delle due parti: se il team ne ha fatti di più, i nemici incassano la differenza; se ne hanno fatti di più i nemici, la differenza passa a un solo personaggio, a caso. A <b>pareggio</b> (con almeno 1 danno dei giocatori) i nemici incassano <b>1 solo danno</b>.',
    'A fine giro si può <b>ritirarsi</b> nel portale (check di Destrezza di gruppo, vale il valore più basso). Un nemico <b>persistente</b> sconfitto va anche seminato: check di Destrezza di gruppo (valore più alto), se fallisce lo stesso Incontro torna.',
  ]],
];

const BLOCKS_RIGHT = [
  ['Salute e danni', [
    '<b>Punti Vita:</b> a 0 si sviene, sotto 0 si muore (il Barbaro resta in piedi a 0).',
    '<b>Resistenza:</b> se la tua classe è resistente a una famiglia di piani, il <b>primo danno a ogni ingresso</b> in un piano di quella famiglia è parato.',
  ]],
  ['Piani di Recupero', [
    'Chi li attraversa: <b>+1 PV</b> (mai oltre il massimo), <b>1 spell</b> a scelta della scuola se ne ha meno del numero scritto in scheda, <b>abilità di classe</b> ricaricata. Spariscono tutti i depotenziamenti <b>e</b> tutti i bonus temporanei.',
  ]],
  ['Follia e Corruzione', [
    'Ogni punto di <b>Sanità</b> perso richiede un check di Sanità, ogni punto di <b>Anima</b> perso un check di Anima. Se il check fallisce, si tira un d6. Gli effetti scattano <b>alla fine dell\'Incontro, davanti al portale</b>, prima del salto; poi il personaggio rinsavisce:',
    '<table class="tb"><thead><tr><th>d6</th><th>Follia (Sanità)</th><th>Corruzione (Anima)</th></tr></thead><tbody>' +
      '<tr><td class="r">1–2</td><td>Tenti di trascinare con te un compagno (Contesa di Forza)</td><td>Attacchi con la Forza un compagno a caso: un solo attacco, poi rinsavisci</td></tr>' +
      '<tr><td class="r">3–4</td><td>Salti da solo in un portale casuale</td><td>Non entri nel portale con il team: devi essere trascinato dentro (poi rinsavisci), altrimenti resti lì da solo</td></tr>' +
      '<tr><td class="r">5–6</td><td colspan="2">Nulla: solo un brivido</td></tr>' +
    '</tbody></table>',
  ]],
  ['Reroll e risorse', [
    '<b>Reroll:</b> rilancia un dado tuo (check o scontro), mai un check di gruppo. Ladro, Monaco e Saltimbanco ne hanno fissi.',
    '<b>Risorsa planare:</b> un gettone da spendere con mercanti ed entità, e che si può passare a un compagno (per esempio per un suo incantesimo).',
  ]],
  ['Gruppo e vittoria', [
    'Ci si può staccare dal gruppo: chi va da solo <b>viaggia per conto suo</b> (il suo turno, i suoi salti) e può trovare la via di casa anche senza gli altri.',
    'A ogni salto una carta <b>Piano Terreno</b> si aggiunge in fondo al mazzo Piani. Pescarla porta a una destinazione leggendaria: <b>La Via di Casa</b> è una vittoria, altre sono scontri, prove o bonus.',
    '<b>Vince chi torna a casa</b>, anche da solo: non serve che ce la facciano tutti.',
  ]],
];

const SCHOOLS = [
  ['Flusso', 'cura, protezione, benedizioni'],
  ['Essenza', 'magia arcana: illusioni, evocazioni, manipolazione dei portali'],
  ['Divinazione', 'presagi e informazione: guardare e riordinare il mazzo Piani'],
];

function blockHtml(b) {
  return `<section class="blk"><h2>${b[0]}</h2>${b[1].map(p => p.startsWith('<table') ? p : `<p>${p}</p>`).join('')}</section>`;
}

function rowHtml(c) {
  const w = { heavy: 'Pesanti', light: 'Leggere', none: '—' }[c.weapons] || '—';
  const s = c.stats;
  return `<tr>
    <td class="nm"><span>${c.icon}</span>${c.name}</td>
    <td class="n">${s.for}</td><td class="n">${s.int}</td><td class="n">${s.des}</td><td class="n">${s.pv}</td><td class="n">${s.san}</td><td class="n">${s.anima}</td>
    <td class="w">${w}</td>
    <td class="d">${c.desc}</td></tr>`;
}

function html() {
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
    @page{ size:210mm 297mm; margin:0; }
    *{box-sizing:border-box;margin:0;padding:0;}
    html,body{ background:#fff; }
    body{ font-family:'Source Serif 4',Georgia,serif; color:#241a2e; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .sheet{ position:relative; width:210mm; height:297mm; overflow:hidden; background:#f7f0e1; page-break-after:always; padding:11mm 12mm 0; }
    .sheet:last-child{ page-break-after:auto; }
    .band{ display:flex; align-items:baseline; justify-content:space-between; border-bottom:.5mm solid #b8874a; padding-bottom:2.2mm; }
    .band h1{ font-family:'Cinzel',serif; font-weight:700; font-size:8.2mm; letter-spacing:.05em; color:#3a2347; }
    .band span{ font-family:'JetBrains Mono',monospace; font-weight:700; font-size:2.9mm; letter-spacing:.08em; color:#8a6a35; text-transform:uppercase; }
    .cols{ margin-top:4.5mm; display:grid; grid-template-columns:1fr 1fr; gap:6mm; }
    .col{ display:flex; flex-direction:column; gap:3mm; }
    .blk{ background:#fffaf0; border:.3mm solid #cdb98f; border-radius:2mm; padding:3mm 3.6mm 3.2mm; }
    .blk h2{ font-family:'Cinzel',serif; font-weight:700; font-size:4.2mm; letter-spacing:.06em; text-transform:uppercase; color:#8a5a1f; margin-bottom:1.6mm; }
    .blk p{ font-size:3.12mm; line-height:1.29; margin-top:1.3mm; }
    .blk p:first-of-type{ margin-top:0; }
    .blk b{ color:#3a2347; }
    .tb{ margin-top:1.8mm; width:100%; border-collapse:collapse; }
    .tb th{ font-family:'JetBrains Mono',monospace; font-size:2.7mm; letter-spacing:.03em; text-transform:uppercase; color:#8a6a35; text-align:left; padding:0 1.4mm 1.2mm; border-bottom:.35mm solid #b8874a; }
    .tb td{ font-size:2.95mm; line-height:1.25; padding:1.4mm 1.4mm; border-bottom:.2mm solid #d8c9a6; vertical-align:top; }
    .tb tr:last-child td{ border-bottom:none; }
    .tb td.r{ font-family:'JetBrains Mono',monospace; font-weight:700; color:#3a2347; white-space:nowrap; width:11mm; }
    .foot{ position:absolute; left:12mm; right:12mm; bottom:6mm; display:flex; justify-content:space-between; font-family:'JetBrains Mono',monospace; font-size:2.6mm; color:#8a7a5c; }

    table{ margin-top:4.2mm; width:100%; border-collapse:collapse; }
    th{ font-family:'JetBrains Mono',monospace; font-weight:700; font-size:2.7mm; letter-spacing:.04em; text-transform:uppercase; color:#8a6a35; text-align:left; padding:0 1mm 1.4mm; border-bottom:.4mm solid #b8874a; }
    th.n, td.n{ text-align:center; width:6.2mm; padding-left:0; padding-right:0; }
    td{ vertical-align:top; padding:1.8mm 1mm; border-bottom:.2mm solid #d8c9a6; }
    td.nm{ font-family:'Cinzel',serif; font-weight:700; font-size:3.7mm; color:#3a2347; white-space:nowrap; width:34mm; }
    td.nm span{ display:inline-block; width:6mm; font-size:4.2mm; }
    td.n{ font-family:'JetBrains Mono',monospace; font-weight:700; font-size:3.4mm; color:#241a2e; }
    td.w{ font-size:3.2mm; color:#5a4b36; width:14mm; }
    td.d{ font-size:3.4mm; line-height:1.28; }
    tr:nth-child(even) td{ background:rgba(184,135,74,.07); }
    .schools{ margin-top:4mm; display:grid; grid-template-columns:repeat(3,1fr); gap:3mm; }
    .sc{ background:#fffaf0; border:.3mm solid #cdb98f; border-radius:2mm; padding:2.2mm 3mm; font-size:3.2mm; line-height:1.28; }
    .sc b{ display:block; font-family:'Cinzel',serif; font-size:3.7mm; color:#8a5a1f; margin-bottom:.6mm; }
    .legend{ margin-top:3mm; font-size:3mm; line-height:1.3; color:#5a4b36; }
    .legend b{ color:#3a2347; }
  </style></head><body>
  <div class="sheet" id="fronte">
    <div class="band"><h1>Promemoria del giocatore</h1><span>Planar Escape</span></div>
    <div class="cols">
      <div class="col">${BLOCKS_LEFT.map(blockHtml).join('')}</div>
      <div class="col">${BLOCKS_RIGHT.map(blockHtml).join('')}</div>
    </div>
    <div class="foot"><span>Fronte · regole di base</span><span>planar-escape.vercel.app/gioco</span></div>
  </div>
  <div class="sheet" id="retro">
    <div class="band"><h1>Le tredici classi</h1><span>Planar Escape</span></div>
    <table>
      <thead><tr><th>Classe</th><th class="n">For</th><th class="n">Int</th><th class="n">Des</th><th class="n">PV</th><th class="n">San</th><th class="n">Ani</th><th>Armi</th><th>Capacità</th></tr></thead>
      <tbody>${CLASSES.map(rowHtml).join('')}</tbody>
    </table>
    <div class="legend"><b>Armi:</b> tutti possono usare le armi base; "Leggere" e "Pesanti" indicano fin dove arriva la classe. <b>Ricarica a Recupero:</b> le capacità a carica tornano disponibili trovando un piano di Recupero.</div>
    <div class="schools">${SCHOOLS.map(s => `<div class="sc"><b>${s[0]}</b>${s[1]}</div>`).join('')}</div>
    <div class="foot"><span>Retro · classi e scuole di incantesimi</span><span>Gli incantesimi sono carte pescate dalla scuola della classe</span></div>
  </div></body></html>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PRINT_DIR, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
  const tmp = path.join(__dirname, '_tmp-promemoria-' + Date.now() + '.html');
  fs.writeFileSync(tmp, html());
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2.5 });
  await page.goto('file://' + tmp);
  await page.waitForTimeout(1200); // web font da Google Fonts
  for (const [id, name] of [['fronte', 'promemoria_fronte.png'], ['retro', 'promemoria_retro.png']]) {
    const el = await page.$('#' + id);
    await el.screenshot({ path: path.join(OUT_DIR, name) });
  }
  await page.pdf({ path: path.join(PRINT_DIR, 'promemoria.pdf'), printBackground: true, preferCSSPageSize: true });
  await page.close();
  fs.unlinkSync(tmp);
  await browser.close();
  console.log('Fatto: promemoria.pdf + anteprime in', OUT_DIR);
}
main().catch(e => { console.error(e); process.exit(1); });
