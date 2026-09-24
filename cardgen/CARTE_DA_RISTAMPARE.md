# Carte modificate — da ristampare

Elenco delle carte il cui testo e/o illustrazione sono cambiati **dopo** una stampa già
fatta: per una ristampa, basta rifare queste, non l'intero mazzo. Uso `cardgen/print-patch.js`
(elenco `ITEMS` da aggiornare a mano con le voci di questa lista, poi `node print-patch.js` ->
`cards_final/print/patch_fronte.pdf` + `patch_retro.pdf`, un solo foglio A4 con solo le carte
cambiate).

Ogni riga viene aggiunta qui non appena una carta cambia, e tolta (spostata in "Già
ristampate") solo quando l'utente conferma di aver ristampato quel lotto — non prima.

**Nota per chi rigenera una carta**: la sorgente per l'illustrazione è sempre
`assets/cards_raw/<id>.jpg` (l'arte pulita, permanente), MAI `assets/cards/<id>.png` (quella è
già il composto finale usato dal gioco web — usarla come sorgente ri-compone il testo sopra
sé stesso, vedi il bug del 24/09 sotto). Il risultato va poi copiato su `assets/cards/<id>.png`.

## Da ristampare (non ancora confermato)

| Data | Carta | Tipo | Cosa è cambiato |
|---|---|---|---|
| 2026-09-24 | Eco dal Fondo (Spell essenza, `sp_ecofondo`) | Testo | Vedeva la carta in fondo al mazzo Piani e poteva portarla in cima garantita — troppo forte, rischiava di far vincere troppo facilmente scegliendo la destinazione. Ora: rimescola il mazzo, poi guarda la nuova cima e può rimandarla in fondo se non convince (come Sguardo Fugace, ma con reshuffle prima). |
| 2026-09-24 | Richiamo dal Fondo (Spell divinazione, `sp_richiamofondo`) | Testo | Stesso nerf di Eco dal Fondo, stessa ragione (era la versione gratuita dello stesso problema). |
| 2026-09-24 | Tutte le 13 Classi | Layout | Mancava del tutto l'affinità di partenza (quali scuole di spell e quanti all'inizio) — aggiunta una riga di sigilli di scuola + conteggio (assente sulle classi senza spell: Guerriero/Barbaro/Ladro/Saltimbanco). Statistiche ingrandite, si leggevano poco. Rigenerate tutte da `assets/cards_raw/` con `render-classes.js`, PDF Classi (`classi_fronte.pdf`/`classi_retro.pdf`) rigenerato per intero. |

## Già ristampate / in attesa di conferma stampa

| Data | Carta | Tipo | Cosa è cambiato |
|---|---|---|---|
| 2026-09-23 | Aria (Piano, `aria`) | Illustrazione | Sostituita: l'originale aveva una crepa arancione/infuocata fuori tema in alto a sinistra. Rigenerata con `render.js`, PDF Piani (`piani_fronte.pdf`/`piani_retro.pdf`) rigenerato per intero. |
| 2026-09-24 | Aura Assorbente (Oggetto, `o_auraassorbente`) | Testo | Il testo prometteva una protezione **di squadra** illimitata ("il primo danno subito dal team... illimitato") — troppo forte, e comunque diverso da come il gioco la applica davvero (solo a chi la possiede, si ricarica a ogni piano). Testo riscritto per rispecchiare la meccanica reale. Rigenerata con `render-oggetti.js` (da `assets/cards_raw/`, non da `assets/cards/` — vedi nota sopra, il primo tentativo ha prodotto una carta con testo vecchio e nuovo sovrapposti proprio per questo errore). Foglio patch generato (`patch_fronte.pdf`/`patch_retro.pdf`), PDF Oggetti completo rigenerato per coerenza. |

## Bug incontrati durante le ristampe (per non ripeterli)

- **24/09**: tutti gli script `render-*.js`/`print-*.js` di cardgen leggevano ancora
  `../index.html` invece di `../gioco.html` per estrarre i dati (`extract-data.js`) — risalente
  allo split vetrina/simulatore di qualche giorno prima, mai aggiornato. Corretto.
- **24/09**: aggiunto un cache-buster (`?t=' + Date.now()`) e un nome-file temporaneo univoco
  a ogni run in tutti gli script di render/stampa, per sicurezza contro cache di Chromium su
  URL `file://` — non era la causa del bug sopra (che era la cartella sorgente sbagliata), ma
  è comunque una protezione in più tenuta per il futuro.
