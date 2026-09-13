# Cardgen — compositore di carte Planar Escape

Prende i dati delle carte (nome, famiglia, check, recupero, testo — già dentro `index.html`), una riga di atmosfera per carta (`flavors.json`), e le illustrazioni che generi con l'IA immagini, e produce i PNG finiti pronti per la stampa. Il template è uno solo: cambiano solo dati e immagine, esattamente come il flusso manuale che facevi prima ma automatizzato.

## Prima di iniziare

Serve Node.js (già lo usi per Claude Code) e Playwright:

```
npm install playwright
npx playwright install chromium
```

(va fatto una volta sola)

## Uso — lotto Piani (36 carte)

1. Salva le 36 illustrazioni generate in `assets/cards/` (nella root del progetto, non qui in `cardgen/`), con i nomi esatti elencati in `CARDS_MANIFEST.md` — es. `fuoco.png`, `porte_di_brace.png`, ecc.
2. Da questa cartella (`cardgen/`), lancia:
   ```
   node render.js
   ```
3. Le carte finite escono in `cards_final/piani/`, una PNG per carta, dimensione 1417×827px (= 120×70mm a 300dpi, il formato grande orizzontale dei Piani).

Se una carta non ha ancora l'immagine, esce comunque con un segnaposto colorato (stessa idea dei placeholder dell'app web) invece di bloccare tutto il lotto — così puoi generare le illustrazioni mancanti con calma e rilanciare solo quello che manca.

## Se cambi il testo di una carta

Il testo delle carte viene letto da `piani-data.json`, generato a sua volta da `index.html`. Se modifichi il testo/regole di un Piano in `index.html`, rigenera prima quel file:

```
node extract-data.js
node render.js
```

## Se vuoi cambiare la riga di atmosfera di una carta

È in `flavors.json`, una riga per id — modificala e rilancia `node render.js`, non serve toccare altro.

## File

- `template.js` — il template della carta (HTML/CSS): layout, font, colori per famiglia, badge dei check.
- `render.js` — lo script che compone dati + immagine e produce i PNG (via screenshot headless con Playwright).
- `piani-data.json` — dati delle 36 carte Piano, generato da `index.html`.
- `flavors.json` — le righe di atmosfera, una per carta.
- `extract-data.js` — rigenera `piani-data.json` da `index.html`.

## Estendere ad altri mazzi

Lo stesso `render.js`/`template.js` è pensato per essere riusato per Piano Terreno (stesso formato grande orizzontale) e poi per Incontri/Oggetti/Spell (formato standard verticale, 63×88mm) — quando ci arriviamo, aggiungiamo un secondo template per il formato verticale e un secondo file dati, riusando la stessa logica.
