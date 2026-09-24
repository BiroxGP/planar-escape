# Lingua interfaccia (IT/EN) — stato e regola

`gioco.html` ha un toggle 🌐 IT/EN in alto a destra (persistito in
`localStorage.planarEscapeLang`). Traduce **solo l'interfaccia**: bottoni,
intestazioni, schermate, hint. **Restano sempre in italiano, in ogni lingua**:

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

- `LANG` (`'it'`|`'en'`), letto da `localStorage` al boot.
- `t("Testo italiano esatto")`: cerca la stringa in `I18N_EN` e restituisce la
  traduzione se `LANG==='en'`, altrimenti (o se la voce manca ancora) l'italiano
  originale — **degradazione morbida**, non rompe mai nulla, si amplia un pezzo alla
  volta.
- `applyI18nStatic()`: per i pochi elementi HTML statici fuori da `render()` (gate,
  topbar, header) — non passano da `t()` da soli, vanno aggiornati a mano lì.
- Per frasi con accordo singolare/plurale complesso in italiano (che in inglese non
  serve, es. "devono/deve", "li/lo/la"), si scrive la frase intera per entrambe le
  lingue con un ternario `LANG==='en' ? ... : ...`, invece di forzarle dentro `t()`
  pezzo a pezzo.

## REGOLA per il futuro

Ogni nuova stringa statica di interfaccia (non di carta, non di diario) va avvolta in
`t('...')` e la sua traduzione aggiunta a `I18N_EN`. Se non si fa in tempo, la stringa
resta in italiano anche in modalità EN — non è un errore, è il comportamento di
fallback previsto, ma va segnata qui sotto per essere ripresa più avanti.

## Coperto finora

- Password gate (titolo, hint, placeholder, messaggi di errore/verifica, bottone)
- Topbar (Cambia password/Salva/Carica/Nuova partita, badge accesso)
- Schermata "Prepara il party" (intestazioni, hint, bottoni, nomi giocatore di default)
- Selettore gruppo davanti al portale (Salta/Resta ancora un turno/Dividi il gruppo,
  tutti gli hint di recupero)
- Cornice schermata di gioco (contatori salti/mazzo, pannelli Vittoria/Sconfitta,
  intestazione Diario di viaggio)
- Scheda personaggio nella party-bar (badge di stato, etichette risorse/oggetti/spell,
  bottone Gestisci)

## Non ancora coperto (da riprendere quando serve)

- Tutte le modali dei singoli Incontri/Piani/destinazioni del Piano Terreno (molte,
  ognuna con testo suo — va fatto man mano che si toccano, non tutto insieme)
- Scheda personaggio "Gestisci" (inventario, equip, spell, azioni)
- Modali comuni riusate ovunque (Continua/Chiudi generici) — non tradotte in isolamento
  per non lasciare modali "mezze tradotte" (corpo IT + bottone EN)
- Landing page interna a gioco.html (`renderLanding()`) — quella pubblica è su
  `index.html`/il sito, invariata; questa landing pre-gate non è stata toccata
- Schermate di combattimento (Contesa/scontro boss)
