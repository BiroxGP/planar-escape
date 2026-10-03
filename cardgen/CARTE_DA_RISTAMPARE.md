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
| 2026-09-29 | Sciamano (Classe, `sciamano`) | Dati | Troppo potente: Destrezza ridotta da 3 a 2 (per, int, pv, san, anima invariati). Rigenerata solo questa da `assets/cards_raw/` con `render-classes.js`, copiata su `assets/cards/sciamano.png`, PDF Classi (`classi_fronte.pdf`/`classi_retro.pdf`) rigenerato per intero. |
| 2026-09-30 | Barbaro (Classe, `barbaro`) | Dati | Forza ridotta da 5 a 4 (int, des, pv, san, anima invariati). Rigenerata solo questa da `assets/cards_raw/` con `render-classes.js`, copiata su `assets/cards/barbaro.png`, PDF Classi rigenerato per intero. |
| 2026-09-30 | Warlock (Classe, `warlock`), Negromante (Classe, `negromante`), Monaco (Classe, `monaco`) | Dati | Correzione statistiche: Warlock Anima 5→4, Negromante Sanità Mentale 5→4, Monaco Sanità Mentale 6→5 (tutti gli altri valori invariati). Rigenerate le 3 da `assets/cards_raw/` con `render-classes.js`, copiate su `assets/cards/{warlock,negromante,monaco}.png`, PDF Classi rigenerato per intero. |
| 2026-09-30 | Guerriero (Classe, `guerriero`), Paladino (Classe, `paladino`), Monaco (Classe, `monaco`) | Dati | Ulteriore correzione statistiche: Guerriero Destrezza 3→2, Paladino Destrezza 2→1, Monaco Forza 3→2 (tutti gli altri valori invariati). In questa occasione rigenerate **tutte e 13** le carte Classe da `assets/cards_raw/` con `render-classes.js` (non solo quelle cambiate), perché `cards_final/classi/` per 8 classi (Chierico, Druido, Guerriero, Ladro, Mago, Paladino, Saltimbanco, Veggente) era rimasto fermo al 20/09, prima del layout con badge di affinità aggiunto il 24-25/09 — `assets/cards/` aveva già la versione corretta ma `cards_final/` no, disallineamento segnalato dall'utente. Copiate tutte e 13 su `assets/cards/`, PDF Classi rigenerato per intero. |
| 2026-09-30 | Guerriero (Classe, `guerriero`) | Dati | Ulteriore correzione: Punti Vita ridotti da 5 a 4 (tutti gli altri valori invariati). Rigenerata solo questa da `assets/cards_raw/` con `render-classes.js`, copiata su `assets/cards/guerriero.png`, PDF Classi rigenerato per intero. |
| 2026-09-30 | Paradosso Logico (Incontro Armonia, `ar_paradosso`) | Testo + Illustrazione | La penalità "perdita del turno" non costava nulla su Armonia — cambiata in depotenziamento temporaneo a Intelletto. Illustrazione poi sostituita dall'utente con nuova versione (drop-file da root, `paradosso logico.jpg` -> `assets/cards_raw/ar_paradosso.jpg`). Rigenerata con `render-incontri.js` (mazzo `armonia`), copiata su `assets/cards/ar_paradosso.png`, PDF Incontri (`incontri_fronte.pdf`/`incontri_retro.pdf`) rigenerato per intero. |
| 2026-09-30 | Visione Ingannevole (Incontro Eterei, `et_visione`) | Testo + Illustrazione | Chi fallisce il check ora affronta anche una battaglia mentale in solitaria su Sanità Mentale contro un'illusione (abilità 1). Illustrazione poi sostituita dall'utente (`visione ingannevole.jpg` -> `assets/cards_raw/et_visione.jpg`). Rigenerata con `render-incontri.js` (mazzo `eterei`), copiata su `assets/cards/et_visione.png`, PDF Incontri rigenerato per intero (stesso batch della riga sopra). |
| 2026-09-30 | Distorsione (Incontro Eterei, `et_distorsione`) | Testo + Illustrazione | Da check individuale a check di gruppo di Intelletto; se fallito, il prossimo salto riporta su un piano già visitato. Illustrazione poi sostituita dall'utente (`distorsione.jpg` -> `assets/cards_raw/et_distorsione.jpg`). Rigenerata con `render-incontri.js` (mazzo `eterei`), copiata su `assets/cards/et_distorsione.png`, PDF Incontri rigenerato per intero (stesso batch delle due righe sopra). |
| 2026-09-30 | Tutte le 15 carte Incontro Elementare (`el_nessuno`, `el_elementale`, `el_sciame`, `el_vena`, `el_instabilita`, `el_guida`, `el_mercante`, `el_custode`, `el_amplificazione`, `el_rifugio`, `el_frattura`, `el_onda`, `el_vento`, `el_grotta`, `el_fumo`) | Illustrazione | Tutto il mazzo Elementare sostituito dall'utente con nuove illustrazioni (drop-file da root, una per carta). Rigenerate tutte e 15 con `render-incontri.js` (mazzo `elementare`), copiate su `assets/cards/`, PDF Incontri rigenerato per intero. |
| 2026-10-01 | Tutte le 12 carte Incontro Demoni (`de_nessuno`, `de_tentatore`, `de_bruto`, `de_patto`, `de_orda`, `de_bottino`, `de_sussurro`, `de_guardiano`, `de_fiamme`, `de_mercante`, `de_legione`, `de_infranto`) | Illustrazione | Tutto il mazzo Demoni sostituito dall'utente con nuove illustrazioni (drop-file da root, una per carta). Rigenerate tutte e 12 con `render-incontri.js` (mazzo `demoni`), copiate su `assets/cards/`, PDF Incontri rigenerato per intero. |
| 2026-10-01 | Guida elementale (Incontro Elementare, `el_guida`) | Illustrazione | Sostituita di nuovo dall'utente con un'ulteriore versione (`guida elementare.jpg` -> `assets/cards_raw/el_guida.jpg`). Rigenerata con `render-incontri.js` (mazzo `elementare`), copiata su `assets/cards/el_guida.png`, PDF Incontri rigenerato per intero. |
| 2026-10-01 | Tutte le 12 carte Incontro Non-morti (`nm_nessuno`, `nm_appestato`, `nm_spettro`, `nm_nugolo`, `nm_tomba`, `nm_nebbia`, `nm_lich`, `nm_catena`, `nm_reliquia`, `nm_eco`, `nm_mano`, `nm_cripta`) | Illustrazione | Tutto il mazzo Non-morti sostituito dall'utente con nuove illustrazioni (drop-file da root, una per carta). Rigenerate tutte e 12 con `render-incontri.js` (mazzo `nonmorti`), copiate su `assets/cards/`, PDF Incontri rigenerato per intero. |
| 2026-10-03 | 14 carte Incontro Armonia (tutte tranne `ar_paradosso`, già in lista sopra: `ar_nessuno`, `ar_giudice`, `ar_esattore`, `ar_custode`, `ar_automa`, `ar_oracolo`, `ar_eternita`, `ar_statua`, `ar_benedizione`, `ar_geometria`, `ar_bagliore`, `ar_pattodonore`, `ar_ingranaggio`, `ar_illuminazione`) | Illustrazione | Quasi tutto il mazzo Armonia sostituito dall'utente con nuove illustrazioni (drop-file da root, una per carta). Rigenerate con `render-incontri.js` (mazzo `armonia`), copiate su `assets/cards/`, PDF Incontri rigenerato per intero. |
| 2026-10-01 | Tutte le 15 carte Incontro Eterei (`et_nessuno`, `et_frammento`, `et_visione`, `et_guida`, `et_distorsione`, `et_eco`, `et_entita`, `et_silenzio`, `et_portale`, `et_reliquia`, `et_quiete`, `et_ombra`, `et_incubo`, `et_doppio`, `et_sogno`) | Illustrazione | Tutto il mazzo Eterei sostituito dall'utente con nuove illustrazioni (drop-file da root, una per carta) — `et_visione` ed `et_distorsione` avevano già una voce più vecchia qui sopra, ora superata da questa versione più recente. Rigenerate tutte e 15 con `render-incontri.js` (mazzo `eterei`), copiate su `assets/cards/`, PDF Incontri rigenerato per intero. |

## Già ristampate / in attesa di conferma stampa

| Data | Carta | Tipo | Cosa è cambiato |
|---|---|---|---|
| 2026-09-23 | Aria (Piano, `aria`) | Illustrazione | Sostituita: l'originale aveva una crepa arancione/infuocata fuori tema in alto a sinistra. Rigenerata con `render.js`, PDF Piani (`piani_fronte.pdf`/`piani_retro.pdf`) rigenerato per intero. |
| 2026-09-24 | Aura Assorbente (Oggetto, `o_auraassorbente`) | Testo | Il testo prometteva una protezione **di squadra** illimitata ("il primo danno subito dal team... illimitato") — troppo forte, e comunque diverso da come il gioco la applica davvero (solo a chi la possiede, si ricarica a ogni piano). Testo riscritto per rispecchiare la meccanica reale. Rigenerata con `render-oggetti.js` (da `assets/cards_raw/`, non da `assets/cards/` — vedi nota sopra, il primo tentativo ha prodotto una carta con testo vecchio e nuovo sovrapposti proprio per questo errore). Foglio patch generato (`patch_fronte.pdf`/`patch_retro.pdf`), PDF Oggetti completo rigenerato per coerenza. |
| 2026-09-24 | Eco dal Fondo (Spell essenza, `sp_ecofondo`) | Testo | Vedeva la carta in fondo al mazzo Piani e poteva portarla in cima garantita — troppo forte, rischiava di far vincere troppo facilmente scegliendo la destinazione. Ora: rimescola il mazzo, poi guarda la nuova cima e può rimandarla in fondo se non convince (come Sguardo Fugace, ma con reshuffle prima). Confermata ristampata il 29/09 insieme al resto dell'arretrato. |
| 2026-09-24 | Richiamo dal Fondo (Spell divinazione, `sp_richiamofondo`) | Testo | Stesso nerf di Eco dal Fondo, stessa ragione. Confermata ristampata il 29/09. |
| 2026-09-24 | Tutte le 13 Classi | Layout | Mancava del tutto l'affinità di partenza — aggiunta una riga di sigilli di scuola + conteggio. Statistiche ingrandite. Confermata ristampata il 29/09. |
| 2026-09-28 | Tutti i 36 Piani | Layout | Aggiunta una badge di famiglia (poi trasformata in kicker senza icona sopra al nome). Confermata ristampata il 29/09. |
| 2026-09-28 | 6 Piani (Tenebre, Astrale, Eternità, Vuoto, Decadimento, Putrefazione) | Dati + Testo | Check mancante assegnato, testo "nessun check" tolto dove confondeva. Confermata ristampata il 29/09. |
| 2026-09-28 | 5 Piani (Tempesta, Ombra, Metallo, Sacro, Cristallo) | Illustrazione | Sostituite dall'utente con nuove versioni. Confermata ristampata il 29/09. |

## Bug incontrati durante le ristampe (per non ripeterli)

- **24/09**: tutti gli script `render-*.js`/`print-*.js` di cardgen leggevano ancora
  `../index.html` invece di `../gioco.html` per estrarre i dati (`extract-data.js`) — risalente
  allo split vetrina/simulatore di qualche giorno prima, mai aggiornato. Corretto.
- **24/09**: aggiunto un cache-buster (`?t=' + Date.now()`) e un nome-file temporaneo univoco
  a ogni run in tutti gli script di render/stampa, per sicurezza contro cache di Chromium su
  URL `file://` — non era la causa del bug sopra (che era la cartella sorgente sbagliata), ma
  è comunque una protezione in più tenuta per il futuro.
