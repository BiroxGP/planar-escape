// Icona reroll per l'app web: l'utente ha fornito reroll.png (1601x1601, disegno chiaro su
// sfondo nero pieno, non davvero trasparente nonostante "sfondo trasparente" nel messaggio —
// stesso caso di segnalini.jpg). Composta su un cerchio in tinta con mix-blend-mode:screen
// (il nero sparisce, resta solo il disegno chiaro) cosi' il nero non crea un riquadro visibile
// — stessa tecnica gia' usata per i segnalini e la pedina Compagno/Risorsa Planare in questo
// progetto. Dimensione icona app: stessa risoluzione (200px) di pedina_risorsa_planare_icon.png,
// cosi' le due icone hanno lo stesso peso visivo nella scheda personaggio.
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const SRC = path.join(__dirname, '..', 'assets', 'ui', 'reroll.png');
const OUT = path.join(__dirname, '..', 'assets', 'ui', 'reroll_icon.png');
const SIZE = 200; // stessa dimensione di pedina_risorsa_planare_icon.png

const BG = '#1c3a4a';   // blu/petrolio scuro, diverso dall'oro della risorsa planare per distinguerle a colpo d'occhio
const BORDER = '#7fb8c9'; // anello chiaro coerente col disegno stesso

function html() {
  const url = pathToFileURL(SRC).href;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;}
    body{ background:transparent; }
    .icon{
      position:relative; width:${SIZE}px; height:${SIZE}px; border-radius:50%; overflow:hidden;
      background:radial-gradient(circle at 50% 42%, color-mix(in srgb, ${BORDER} 30%, ${BG}) 0%, ${BG} 70%, #0c1a20 100%);
      box-shadow:inset 0 0 0 ${Math.max(2, Math.round(SIZE*.02))}px color-mix(in srgb, ${BORDER} 65%, #f4ede0);
    }
    .art{
      position:absolute; inset:${Math.round(SIZE*.08)}px;
      background-image:url(${url}); background-size:contain; background-repeat:no-repeat; background-position:center;
      mix-blend-mode:screen;
    }
  </style></head><body><div class="icon"><div class="art"></div></div></body></html>`;
}

async function main() {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
  const tmp = path.join(__dirname, '_tmp-reroll-' + Date.now() + '.html');
  fs.writeFileSync(tmp, html());
  await page.goto('file://' + tmp + '?t=' + Date.now());
  await page.waitForTimeout(200);
  await page.screenshot({ path: OUT, omitBackground: true });
  fs.unlinkSync(tmp);
  await browser.close();
  console.log('Fatto:', OUT);
}
main().catch(err => { console.error(err); process.exit(1); });
