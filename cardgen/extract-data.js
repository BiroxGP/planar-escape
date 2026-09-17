// Rigenera piani-data.json e piano-terreno-data.json leggendo i dati direttamente
// da ../index.html, così restano sempre sincronizzati con l'ultima versione delle
// regole (utile da rilanciare se cambi il testo di un Piano o di una destinazione
// del Piano Terreno in index.html).
//
// Uso: node extract-data.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const indexPath = path.join(__dirname, '..', 'index.html');
const src = fs.readFileSync(indexPath, 'utf8');

// tagliamo lo script subito prima della sezione di stato/persistenza:
// a quel punto tutti gli array dati (PIANI, INCONTRI, OGGETTI, SPELL, PIANO_TERRENO)
// sono già definiti, e non abbiamo ancora toccato codice che tocca il DOM.
const CUT_MARKERS = [
  '/* ---------------- persistence ---------------- */',
  '/* ---------------- STATO DI GIOCO ---------------- */',
];
let idx = -1;
for (const m of CUT_MARKERS) { idx = src.indexOf(m); if (idx !== -1) break; }
if (idx === -1) {
  console.error('Non trovo il punto di taglio in index.html: potrebbero aver rinominato la sezione.');
  console.error('Cerca a mano un commento tipo "STATO DI GIOCO" o "persistence" e aggiorna CUT_MARKERS in questo script.');
  process.exit(1);
}

const scriptStart = src.indexOf('<script>') + '<script>'.length;
let code = src.slice(scriptStart, idx);
code += '\nthis.__DATA__ = { PIANI: PIANI, PIANO_TERRENO: PIANO_TERRENO, CLASSES: CLASSES, INCONTRI: INCONTRI, SPELLS: SPELLS, OGGETTI: OGGETTI };\n';

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

if (!sandbox.__DATA__ || !Array.isArray(sandbox.__DATA__.PIANI)) {
  console.error('Estrazione fallita: PIANI non trovato.');
  process.exit(1);
}
if (!Array.isArray(sandbox.__DATA__.PIANO_TERRENO)) {
  console.error('Estrazione fallita: PIANO_TERRENO non trovato.');
  process.exit(1);
}
if (!sandbox.__DATA__.CLASSES || typeof sandbox.__DATA__.CLASSES !== 'object') {
  console.error('Estrazione fallita: CLASSES non trovato.');
  process.exit(1);
}
if (!sandbox.__DATA__.INCONTRI || typeof sandbox.__DATA__.INCONTRI !== 'object') {
  console.error('Estrazione fallita: INCONTRI non trovato.');
  process.exit(1);
}
if (!sandbox.__DATA__.SPELLS || typeof sandbox.__DATA__.SPELLS !== 'object') {
  console.error('Estrazione fallita: SPELLS non trovato.');
  process.exit(1);
}
if (!Array.isArray(sandbox.__DATA__.OGGETTI)) {
  console.error('Estrazione fallita: OGGETTI non trovato.');
  process.exit(1);
}

fs.writeFileSync(path.join(__dirname, 'piani-data.json'), JSON.stringify(sandbox.__DATA__.PIANI, null, 2));
console.log(`OK — ${sandbox.__DATA__.PIANI.length} piani scritti in piani-data.json`);

// "finale" = destinazione che porta a vincere la partita (i 3 veri finali A/B/C),
// non le altre 9 destinazioni speciali (bonus/rischio) — stessa regola di index.html
// (kind:"finaleA", oppure kind:"boss" con finale:true come L'Antro della Creatura).
// "personalExit" = uscita personale di una classe (kind:"terrestre" con exitFor:
// Flora Aliena per il Druido, Età della Terra Antica per lo Sciamano).
const pianoTerreno = sandbox.__DATA__.PIANO_TERRENO.map(p => ({
  id: p.id,
  name: p.name,
  text: p.text,
  finale: p.kind === 'finaleA' || !!p.finale,
  personalExit: !!p.exitFor,
}));
fs.writeFileSync(path.join(__dirname, 'piano-terreno-data.json'), JSON.stringify(pianoTerreno, null, 2));
console.log(`OK — ${pianoTerreno.length} destinazioni Piano Terreno scritte in piano-terreno-data.json (${pianoTerreno.filter(p=>p.finale).length} finali, ${pianoTerreno.filter(p=>p.personalExit).length} uscite personali)`);

// CLASSES è un oggetto {id: {...}}, non un array come gli altri due: aggiungiamo l'id.
const classes = Object.entries(sandbox.__DATA__.CLASSES).map(([id, c]) => ({
  id,
  name: c.name,
  icon: c.icon,
  stats: { for: c.for, int: c.int, des: c.des, pv: c.pv, san: c.san, anima: c.anima },
  weapons: c.weapons,
  resistance: c.resistance || [],
  stealth: !!c.stealth,
  waterOk: !!c.waterOk,
  reroll: c.reroll || 0,
  rerollLvl: c.rerollLvl || 0,
  affinity: c.affinity || {},
  exitPlane: c.exitPlane || null, // Druido/Sciamano: uscita personale verso una destinazione del Piano Terreno
  desc: c.desc,
}));
fs.writeFileSync(path.join(__dirname, 'classes-data.json'), JSON.stringify(classes, null, 2));
console.log(`OK — ${classes.length} classi scritte in classes-data.json`);

// INCONTRI è {deckKey: [carte...]}; il deckKey non è sempre il nome della Famiglia
// (demoni -> demoniaco), stessa mappa usata da P() in index.html per plane.deck.
const DECK_TO_FAMILY = { demoni: 'demoniaco', nonmorti: 'nonmorti' };
const incontri = [];
for (const [deckKey, cards] of Object.entries(sandbox.__DATA__.INCONTRI)) {
  for (const card of cards) {
    incontri.push({
      id: card.id,
      name: card.name,
      deck: deckKey,
      family: DECK_TO_FAMILY[deckKey] || deckKey,
      type: card.type,
      text: card.text,
      manual: !!card.manual,
      forte: !!card.forte,
      persistent: !!card.persistent,
    });
  }
}
fs.writeFileSync(path.join(__dirname, 'incontri-data.json'), JSON.stringify(incontri, null, 2));
console.log(`OK — ${incontri.length} carte Incontro scritte in incontri-data.json`);

// SPELLS è {scuola: [spell...]}, stessa forma di INCONTRI.
const spells = [];
for (const [school, list] of Object.entries(sandbox.__DATA__.SPELLS)) {
  for (const sp of list) {
    spells.push({
      id: sp.id,
      name: sp.name,
      school,
      text: sp.text,
      cost: sp.cost || 0,
    });
  }
}
fs.writeFileSync(path.join(__dirname, 'spells-data.json'), JSON.stringify(spells, null, 2));
console.log(`OK — ${spells.length} spell scritti in spells-data.json`);

// OGGETTI è un array piatto già; teniamo solo i campi utili al render della carta.
const oggetti = sandbox.__DATA__.OGGETTI.map(o => ({
  id: o.id,
  name: o.name,
  cat: o.cat,
  text: o.text,
  tier: o.tier || null,
  slot: o.slot || null,
}));
fs.writeFileSync(path.join(__dirname, 'oggetti-data.json'), JSON.stringify(oggetti, null, 2));
console.log(`OK — ${oggetti.length} oggetti scritti in oggetti-data.json`);
