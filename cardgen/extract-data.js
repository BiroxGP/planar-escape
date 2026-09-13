// Rigenera piani-data.json leggendo i dati direttamente da ../index.html,
// così restano sempre sincronizzati con l'ultima versione delle regole
// (utile da rilanciare se cambi il testo di qualche Piano in index.html).
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
code += '\nthis.__DATA__ = { PIANI: PIANI };\n';

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

if (!sandbox.__DATA__ || !Array.isArray(sandbox.__DATA__.PIANI)) {
  console.error('Estrazione fallita: PIANI non trovato.');
  process.exit(1);
}

fs.writeFileSync(path.join(__dirname, 'piani-data.json'), JSON.stringify(sandbox.__DATA__.PIANI, null, 2));
console.log(`OK — ${sandbox.__DATA__.PIANI.length} piani scritti in piani-data.json`);
