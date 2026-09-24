// Renderizza i dorsi delle carte (retro): l'arte ha già una zona circolare volutamente
// semplice e scura al centro, riservata per scriverci sopra l'etichetta di categoria.
// Legge le immagini grezze da assets/cards_raw (retro_<id>.jpg) e scrive i PNG finiti
// in cards_final/retro/, per la revisione prima di metterli in assets/cards.
//
// Uso: node render-retro.js [artDir] [outDir]

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { cardBackPageHtml, CARD_W, CARD_H, PORTRAIT_CARD_W, PORTRAIT_CARD_H, FAMILY_ACCENT } = require('./template.js');

const SCHOOL_ACCENT = { essenza: '#a855e0', flusso: '#d9924a', divinazione: '#7c7fe0' };
const CLASS_ACCENT = '#7a2f3d';
const ITEM_ACCENT = '#c9932a';
const PIANO_ACCENT = '#a3781c';

const BACKS = [
  { id: 'retro_classi', label: 'Classe', accent: CLASS_ACCENT, shape: 'portrait', labelPos: 'belowCircle' },
  { id: 'retro_piani', label: 'Piano', accent: PIANO_ACCENT, shape: 'landscape', labelPos: 'circle' },
  { id: 'retro_oggetto', label: 'Oggetto', accent: ITEM_ACCENT, shape: 'portrait', labelPos: 'circle' },
  { id: 'retro_spell_essenza', label: 'Essenza', accent: SCHOOL_ACCENT.essenza, shape: 'portrait', labelPos: 'circle' },
  { id: 'retro_spell_flusso', label: 'Flusso', accent: SCHOOL_ACCENT.flusso, shape: 'portrait', labelPos: 'circle' },
  { id: 'retro_spell_divinazione', label: 'Divinazione', accent: SCHOOL_ACCENT.divinazione, shape: 'portrait', labelPos: 'circle', fontSize: 30 },
  { id: 'retro_incontro_armonia', label: 'Armonia', accent: FAMILY_ACCENT.armonia, shape: 'portrait', labelPos: 'circle' },
  { id: 'retro_incontro_demoni', label: 'Demoniaco', accent: FAMILY_ACCENT.demoniaco, shape: 'portrait', labelPos: 'circle' },
  { id: 'retro_incontro_elementare', label: 'Elementare', accent: FAMILY_ACCENT.elementare, shape: 'portrait', labelPos: 'circle' },
  { id: 'retro_incontro_entropia', label: 'Entropia', accent: FAMILY_ACCENT.entropia, shape: 'portrait', labelPos: 'circle' },
  { id: 'retro_incontro_eterei', label: 'Eterei', accent: FAMILY_ACCENT.eterei, shape: 'portrait', labelPos: 'circle' },
  { id: 'retro_incontro_generico', label: 'Generico', accent: FAMILY_ACCENT.generico, shape: 'portrait', labelPos: 'circle' },
  { id: 'retro_incontro_nonmorti', label: 'Non-morti', accent: FAMILY_ACCENT.nonmorti, shape: 'portrait', labelPos: 'circle', fontSize: 34 },
];

async function main() {
  const artDir = process.argv[2] || path.join(__dirname, '..', 'assets', 'cards_raw');
  const outDir = process.argv[3] || path.join(__dirname, '..', 'cards_final', 'retro');
  fs.mkdirSync(outDir, { recursive: true });

  const html = cardBackPageHtml(BACKS, artDir);
  const htmlPath = path.join(__dirname, '_render-retro.html');
  fs.writeFileSync(htmlPath, html);

  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium',
  });
  const page = await browser.newPage({ viewport: { width: CARD_W + 200, height: CARD_H + 100 } });
  await page.goto('file://' + htmlPath + '?t=' + Date.now()); // cache-buster: Chromium può cache-are l'URL file:// per path, servendo una versione vecchia se il contenuto cambia tra run
  await page.waitForTimeout(1500);

  for (const b of BACKS) {
    const el = await page.$(`#card-${b.id}`);
    if (!el) { console.log('MANCA nel DOM:', b.id); continue; }
    const outPath = path.join(outDir, b.id + '.png');
    await el.screenshot({ path: outPath });
    console.log('OK  ', b.id, '->', outPath);
  }

  await browser.close();
  console.log(`\nFatto: ${BACKS.length} dorsi renderizzati in ${outDir}`);
}

main().catch(err => { console.error(err); process.exit(1); });
