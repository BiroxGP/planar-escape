# Lingua interfaccia (IT/EN) — stato e regola

Sia `index.html` (la vetrina pubblica, prima pagina che chiunque vede) sia
`gioco.html` (il simulatore gated) hanno un selettore IT/EN — due pillole, non un
singolo pulsante "vai a EN" (quello confondeva: mostrava la lingua a cui si sarebbe
passati, non quella attiva, e sembrava "invertito"). Entrambi leggono/scrivono la
**stessa chiave** `localStorage.planarEscapeLang`, quindi la scelta fatta sulla
vetrina pubblica si porta dietro entrando nel simulatore (stesso dominio/origine).
Traduce **solo l'interfaccia**: bottoni, intestazioni, schermate, hint. **Restano
sempre in italiano, in ogni lingua**:

- Il Diario di viaggio (narrazione dinamica generata dagli Incontri/Piani) — troppo
  costoso da tradurre bene (accordi di genere/plurale intrecciati nella logica) e
  concettualmente più vicino a "contenuto di carta" che a interfaccia.
- Tutti i dati delle carte: nomi/testi di Piani, Incontri, Oggetti, Spell, Classi,
  destinazioni del Piano Terreno. Identico al sito pubblico e alle carte stampate.
- Le etichette delle statistiche (Forza/Intelletto/Destrezza/PV/Sanità/Anima) e le
  abbreviazioni nei dadi (`for`/`int`/`des`/`pv`/`san`/`anima`): compaiono anche sulle
  carte stampate, tradurle solo nell'app creerebbe disallineamento con chi gioca con le
  carte fisiche davanti.

## Meccanismo

- `LANG` (`'it'`|`'en'`), letto da `localStorage` al boot (in un try/catch: non
  esiste nel sandbox Node di `cardgen/extract-data.js`, e potrebbe essere bloccato
  dal browser).
- `t("Testo italiano esatto")`: cerca la stringa in `I18N_EN` e restituisce la
  traduzione se `LANG==='en'`, altrimenti (o se la voce manca ancora) l'italiano
  originale — **degradazione morbida**, non rompe mai nulla, si amplia un pezzo alla
  volta.
- `applyI18nStatic()` (in `gioco.html`; `applyLang()` in `index.html`, stesso
  concetto ma nome diverso): per i pochi elementi HTML statici fuori da `render()`
  (gate, topbar, header, e in `index.html` tutta la pagina essendo priva di motore
  JS) — non passano da `t()` da soli, vanno aggiornati a mano lì. In `gioco.html` è
  chiamata da `render()` a OGNI passaggio (non solo dal gate/dal toggle), altrimenti
  il selettore lingua sulla schermata di setup (raggiungibile con `state===null`,
  prima che una partita inizi) restava sull'ultima lingua invece di seguire il
  cambio — bug reale scoperto e corretto il 25/09.
- Per frasi con accordo singolare/plurale complesso in italiano (che in inglese non
  serve, es. "devono/deve", "li/lo/la"), si scrive la frase intera per entrambe le
  lingue con un ternario `LANG==='en' ? ... : ...`, invece di forzarle dentro `t()`
  pezzo a pezzo.
- Il selettore lingua è due pulsanti `.lang-switch .lang-opt[data-lang]`, quello
  attivo evidenziato con `.active` — mostra sempre la lingua CORRENTE, non quella a
  cui si passerebbe (il vecchio pulsante singolo "🌐 EN"/"🌐 IT" aveva confuso
  l'utente, sembrava "al contrario").

## REGOLA per il futuro

Ogni nuova stringa statica di interfaccia (non di carta, non di diario) va avvolta in
`t('...')` e la sua traduzione aggiunta a `I18N_EN`. Se non si fa in tempo, la stringa
resta in italiano anche in modalità EN — non è un errore, è il comportamento di
fallback previsto, ma va segnata qui sotto per essere ripresa più avanti.

## Coperto finora

- **`index.html`** (la vetrina pubblica, la vera "prima pagina" — vedi nota sotto):
  tradotta per intero (hero, "Da dove nasce", badge progetto indie, "Come si gioca",
  le 4 classi mostrate, didascalie dei 4 video, badge spoiler, CTA finale). I nomi
  delle classi restano in italiano, stesso trattamento del resto del progetto.
- Password gate (titolo, hint, placeholder, messaggi di errore/verifica, bottone)
- Topbar (Cambia password/Salva/Carica/Nuova partita, badge accesso)
- Schermata "Prepara il party" (intestazioni, hint, bottoni, nomi giocatore di default)
- Selettore gruppo davanti al portale (Salta/Resta ancora un turno/Dividi il gruppo,
  tutti gli hint di recupero)
- Cornice schermata di gioco (contatori salti/mazzo, pannelli Vittoria/Sconfitta,
  intestazione Diario di viaggio)
- Scheda personaggio nella party-bar (badge di stato, etichette risorse/oggetti/spell,
  bottone Gestisci)

## Nota: la landing interna a gioco.html è irraggiungibile

`renderLanding()` dentro `gioco.html` esiste ed è stata tradotta anche lei (stesso
selettore lingua in overlay sulla copertina), ma **non si vede mai**:
`landingDismissed` parte a `true` fissa (commento nel codice: "gioco.html è solo il
simulatore, la vetrina pubblica vive in index.html") e nessun percorso lo rimette a
`false`. Chi entra col gate vede direttamente "Prepara il party". Scoperto il 25/09
dopo aver tradotto quella schermata pensando fosse la prima cosa vista dagli utenti
— non lo è, **`index.html` lo è**, da cui la voce sopra. Non ho rimosso il lavoro
fatto su `renderLanding()` (innocuo, pronto se `landingDismissed` cambiasse un
giorno), ma non contava come "prima pagina tradotta" finché `index.html` non lo è
stato a sua volta.

## Non ancora coperto (da riprendere quando serve)

- Tutte le modali dei singoli Incontri/Piani/destinazioni del Piano Terreno (molte,
  ognuna con testo suo — va fatto man mano che si toccano, non tutto insieme)
- Scheda personaggio "Gestisci" (inventario, equip, spell, azioni)
- Modali comuni riusate ovunque (Continua/Chiudi generici) — non tradotte in isolamento
  per non lasciare modali "mezze tradotte" (corpo IT + bottone EN)
- Schermate di combattimento (Contesa/scontro boss)
