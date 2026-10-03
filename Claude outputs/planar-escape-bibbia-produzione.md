# Planar Escape — Bibbia di produzione
**Stato al:** 21 settembre 2026
**Scopo di questo file:** tenere allineate tutte le sessioni (questa o future) sullo stato reale del progetto — arte, carte, sistema icone, video, piano di comunicazione — così che aprendo una nuova conversazione non serva ripartire da zero. Non sostituisce il regolamento completo né il progetto reale ("il code"): è la bibbia della *pipeline di produzione* (contenuti, arte, comunicazione). Va riconciliato con il code reale appena possibile — vedi sezione 9.

---

## 0. Fonti

- **Pagina prompt immagini (Artifact, sempre aggiornata):** https://claude.ai/artifact/WwLWGcmpgX1CptEMw3xpGZ — un prompt pronto per ogni carta/icona/video, in inglese, copia-incolla per generatori immagine/video.
- **Documento di design master:** vive in una sessione precedente (file cache locale), contiene il regolamento completo e le tabelle di tutte le carte con effetti — fonte di verità per le regole, ma può essere disallineato rispetto alle modifiche fatte *dopo* la sua ultima lettura (vedi sezione 6).
- **CARDS_MANIFEST.md:** elenco dei nomi file asset canonici (es. `o_spada_corta.png`), usato per gli `id`/nomi file nella pagina prompt.
- **Il code reale:** `C:\Users\gabri\Planar Escape` — app web single-file (`index.html`), con `CLAUDE.md`, `CARDS_MANIFEST.md`, cartelle `assets/`, `cardgen/`, `cards_final/`, repo git collegato e deploy su Vercel. **Collegato e verificato il 21 settembre 2026.** È la fonte di verità finale quando i due documenti divergono — vedi sezione 5 per la prima riconciliazione fatta.

**Regola operativa — verifiche sul code reale:** ogni volta che Gabriele chiede di ricontrollare qualcosa rispetto al code reale, il controllo richiede che il PC sia acceso e collegato in quel momento. Se il collegamento non risulta attivo, non si assume né si finge di aver verificato: si dice chiaramente che il PC non è raggiungibile in quel momento e si aspetta che venga acceso/collegato per fare il controllo vero (oppure si procede solo su quanto riportato a voce da Gabriele, segnalandolo come non verificato sul code).

---

## 1. Premessa del gioco

Un gruppo di avventurieri sta per essere spazzato via da un nemico troppo forte per loro. All'ultimo momento, tenendosi per mano, aprono un portale e fuggono — senza sapere dove porti. Da lì inizia la partita vera e propria: un viaggio tra piani dimensionali generati a caso (elementali, il Piano Negativo dei non-morti, quello demoniaco, piani di luce, tenebre, follia...) con un solo vero obiettivo: tornare a casa sani e salvi.

Il gesto "tenersi per mano prima di saltare nel portale" è il filo conduttore visivo di tutta la produzione (carte, icone, video).

---

## 2. Mazzo di gioco — stato di completamento (prompt immagine)

| Categoria | Carte | Stato |
|---|---|---|
| Piani | 36 | ✓ completo |
| Piano Terreno (destinazioni leggendarie) | 12 | ✓ completo |
| Classi | 13 | ✓ completo |
| Incontri — Elementare | 15 | ✓ completo |
| Incontri — Demoni | 12 | ✓ completo |
| Incontri — Non-morti | 12 | ✓ completo |
| Incontri — Eterei | 15 | ✓ completo |
| Incontri — Armonia | 15 | ✓ completo |
| Incontri — Entropia | 15 | ✓ completo |
| Incontri — Generico (nessuna famiglia) | 14 | ✓ completo |
| Spell — Essenza | 13 | ✓ completo |
| Spell — Flusso | 12 | ✓ completo |
| Spell — Divinazione | 6 | ✓ completo |
| Oggetti (pool unico, sub-categorie sotto) | 60 | ✓ completo |

**Totale carte con prompt immagine pronto: 250/250.**

Sub-categorie Oggetti: Armi (17), Armature (6), Scudi (2, categoria a parte — vedi sez. 6), Anelli (6), Pozioni (7), Protezioni (7), Oggetti one-shot (6), Oggetti particolari (9).

**Icone overlay (asset separati, da comporre in post-produzione sopra le carte):**
- Scuole Spell (Essenza/Flusso/Divinazione): 3/3 ✓
- Categorie Oggetti (Armi/Armature/Scudi/Consumabili/Altro): 5/5 ✓
- Famiglie Piani/Incontri (Elementare, Eterei, Armonia, Entropia, Demoniaco, Non-morti, Piano Terreno leggendario, Terrestre, Generico): **0/9 — non ancora fatte**, stessa logica delle altre, da avviare quando vuoi.

**Retro delle carte:** 13/13 ✓ (Piano universale ×1, Incontro per famiglia ×7, Classi ×1, Spell per scuola ×3, Oggetti universale ×1).

**Video promozionali:** 4, tutti bozzati, in fase di test/correzione con l'utente (vedi sezione 7).

**Componenti fisici:** 3 prompt aggiunti — Plancia Giocatore (fondamentale: 6 slot dadi da 1cm per Forza/Destrezza/Intelletto/Punti Vita/Sanità Mentale/Anima, con doppia iconcina potenziato/indebolito per slot), coppia di icone Potenziato/Indebolito, e un Tabellone facoltativo (zone-mazzo per Piani/Incontri/Spell/Oggetti/scarti, pensato per stampa su due A4 uniti in formato A3) — aggiunto perché ai raduni come IDEAG un gioco senza nulla di fisico steso sul tavolo tende a "leggersi" come meno pronto, anche a parità di qualità delle carte.

---

## 3. Sistema colori/famiglie

| Famiglia/Scuola/Categoria | Hex |
|---|---|
| Elementare | `#c1531f` |
| Eterei | `#3a5aa8` |
| Armonia | `#b89323` |
| Entropia | `#5f3f92` |
| Demoniaco | `#8f1f1f` |
| Non-morti | `#3d5c40` |
| Piano Terreno (leggendario) | `#a67c27` |
| Terrestre | `#7a5a2e` |
| Generico | `#146b67` |
| Spell — Essenza | `#8a4fc9` |
| Spell — Flusso | `#d98c5f` |
| Spell — Divinazione | `#8b7fc7` |
| Oggetti — Armi | `#8a97a3` |
| Oggetti — Armature | `#8c5a52` |
| Oggetti — Scudi | `#4fb8c4` |
| Oggetti — Consumabili | `#8fbf3f` |
| Oggetti — Altro | `#4a2d5c` |

Tutti i valori sono distinti tra loro apposta, per riconoscere ogni gruppo a colpo d'occhio su retro carte e icone.

**Colori delle 6 caratteristiche/dadi** (nuovi, per la plancia giocatore — distinti da tutti i colori sopra):

| Caratteristica | Hex |
|---|---|
| Forza | `#b5432e` |
| Destrezza | `#4f7942` |
| Intelletto | `#3d5a80` |
| Punti Vita | `#a13350` |
| Sanità Mentale | `#7a5a78` |
| Anima | `#e8dfc0` |

---

## 4. Sistema icone/sigilli — decisioni prese e perché

1. **Niente sigillo disegnato dentro ogni scena.** Prima idea (un piccolo sigillo nell'angolo di ogni carta, generato insieme alla scena) scartata: la generativa non lo riproduce mai identico da un'immagine all'altra — è un "tell" evidente che è AI.
2. **Icone come asset separati**, generate una volta sola su sfondo nero pieno, da comporre in post-produzione (blend mode "Schermo"/"Screen") sopra ogni carta della categoria corrispondente.
3. **Stile finale delle icone: "sigillo arcano" deliberato** — un cerchio/anello sottile più un motivo geometrico interno, disegno pulito e simmetrico. Ogni prompt include negazioni esplicite: NON deve sembrare uno strappo/crepa/fessura/portale/porta/finestra di alcun tipo, NON un fulmine/zigzag. Si è arrivati a questo stile dopo due tentativi falliti (prima sembrava un portale, poi un fulmine).
4. **Framing numerico esatto** in ogni prompt icona (griglia 0-100, anello a 70 unità di diametro, centrato, margine di 15 unità) per limitare il problema reale che le icone escono a dimensioni diverse ad ogni generazione — mitigato ma non garantito al 100%; consigliata normalizzazione manuale in post usando il diametro dell'anello come riferimento fisso.
5. **Card Oggetti = niente icona nella scena**, l'icona di categoria va aggiunta solo dopo, in post-produzione, per le stesse ragioni di consistenza.

---

## 5. Riconciliazione con il code reale — fatta il 21 settembre 2026

Collegato il computer e letto direttamente `index.html` (dati carte) e `CLAUDE.md`. Risultato:

- ✅ **Tentatore → Tentatrice**: confermato, già rinominato nel code reale (id interno resta `de_tentatore`, nome visualizzato "Tentatrice"). Nessuna azione necessaria.
- ✅ **Scudi come categoria a parte**: confermato — il code ha un sistema di badge a 5 categorie Oggetti (`arma`, `armatura`, `scudo`, `consumabile`, `particolare`/altro) che corrisponde esattamente alle 5 icone che avevamo già consolidato qui in autonomia, prima ancora di verificare il code. Buon segno di coerenza.
- ⚠️ **Chiave Planare — CORRETTO, c'era un errore qui**: il testo reale nel code è *"Guarda le prime 2 carte in cima al mazzo Piani: scegli quale mandare in fondo al mazzo, l'altra resta in cima."* — **non è uno scarto**, la carta non voluta torna in fondo al mazzo Piani e resta in gioco. Qui avevamo scritto (erroneamente) "scartane una a scelta". Corretto sia il testo carta che il prompt immagine nella pagina (la seconda carta ora "scivola/affonda" nel mazzo invece di "sfumare via" come uno scarto).
- 🆕 **Segnalini potenziato/indebolito per caratteristica**: non presenti nel code reale — è un'aggiunta di componente fisico proposta qui per la plancia giocatore (sez. 2), il regolamento reale per ora descrive solo i sei d6 con la faccia che mostra il valore attuale. Da valutare se formalizzarla anche a livello di regole, oppure tenerla come semplice aiuto visivo da tavolo senza impatto sul regolamento scritto.

---

## 6. Video promozionali — stato attuale e convenzioni imparate

| Video | Stato/tema |
|---|---|
| **Il salto disperato** | Origine del gioco: fuga disperata da un Drago Antico, riscritto in linguaggio "family-friendly" dopo un rifiuto del generatore per policy contenuti |
| **Mano nella mano** | Versione calma dello stesso gesto: il gruppo si tiene per mano prima di saltare, senza nemico alle spalle |
| **Fuga dalla Tempesta** | Piano Elementare, vento/fulmini — scelto apposta perché elementi difficili da rendere in modo coerente per un generatore video |
| **Fuga dal Baratro** | Piano Demoniaco: combattimento in corso → arriva un'orda di rinforzi → fuga per mano nel portale |

**Convenzioni/lezioni imparate, valide per ogni futuro prompt video:**
- **Telecamera fissa dietro il gruppo** durante le fasi di fuga, per evitare che il generatore mostri il gruppo camminare verso l'obiettivo (o peggio all'indietro) invece che allontanarsi verso il portale.
- **Pericolo sempre fisso su un lato dello sfondo, portale sul lato opposto** tra gruppo e camera — mai il gruppo che si muove verso il pericolo.
- **Il colpo/soffio/orda arriva solo dopo che il gruppo è già sparito** nel portale, mai mentre sono ancora visibili.
- **Linguaggio "family-friendly", non grafico**: dopo che un generatore ha rifiutato un prompt per policy sui contenuti, si sono tolte parole-chiave da possibile filtro violenza (gore, fangs, snarl, fury/rage, "unleash...toward", shockwave, explosive, ecc.) mantenendo la stessa struttura di scena.
- Per scene con **più figure coordinate** (orde, inseguitori multipli): tenere il numero deliberatamente vago ("several", "a horde") invece di un numero preciso, per ridurre il rischio che il generatore ne cambi il conteggio da un taglio all'altro.

---

## 7. Comunicazione/marketing — dove siamo nella discussione

- Obiettivo dichiarato: non vendere il gioco finito ma generare conoscenza, farsi contattare da un editore, e arrivare a **IDEAG Nazionale a Parma** con un minimo di pubblico/community già costruito.
- **Data di lavoro per il countdown: 22 gennaio 2027** — è una stima fissata da Gabriele (non confermata da IDEAG/idea-g.it, che al 21/09/2026 non ha ancora pubblicato la data ufficiale). L'edizione 2026 (la 21ª) si è tenuta 9-11 gennaio 2026 a Parma, quindi un'edizione a gennaio è coerente con lo storico; usiamo questa data per pianificare il calendario editoriale, sapendo che potrebbe spostarsi di qualche settimana — da correggere appena esce l'annuncio ufficiale.
- IDEAG non è una fiera (non si compra/vende): è uno spazio dove i designer testano prototipi con playtester volontari, con 15-25 case editrici presenti a caccia di titoli nuovi. Iscrizione come autore richiede portare il prototipo (foto in fase di registrazione) e permette di fissare incontri diretti con gli editori.
- Ci sono anche tappe locali più piccole durante l'anno ("IDEAG in Tour" — es. Venezia, Padova) utilizzabili come banco di prova prima della Nazionale.
- Strategia di contenuti concordata: mostrare atmosfera/processo creativo (arte, icone, lore, video teaser, foto playtest dal vivo), **non** il regolamento completo o la lista esaustiva di carte/effetti.
- Piattaforme: Instagram come casa principale per arte/video, TikTok/Reels riciclando gli stessi video, Facebook più per entrare in gruppi di appassionati esistenti che per una pagina propria, BoardGameGeek (BGG) da considerare per intercettare editori/appassionati seri.
- **Prossimo passo aperto:** costruire un calendario editoriale settimana-per-settimana da qui a IDEAG, usando l'evento come countdown — non ancora fatto, in attesa che tu confermi se preferisci procedere ora o aspettare la data ufficiale.

---

## 8. Cose ancora aperte / da fare

1. ~~Riconciliare questo file con il code reale~~ — fatto il 21/09/2026, vedi sezione 5. Da ripetere ogni volta che una delle due parti (prompt/regole) cambia in modo sostanziale.
2. Generare le **9 icone di Famiglia** (Piani/Incontri) ancora mancanti, stessa logica delle altre.
3. **Confermare la data ufficiale della prossima IDEAG Nazionale** sul sito idea-g.it e correggere la stima del 22 gennaio 2027 usata per il countdown (sez. 7) appena esce l'annuncio.
4. Costruire il **calendario editoriale** dettagliato per i social, ancorato a IDEAG (data di lavoro: 22 gennaio 2027).
5. Decidere se formalizzare a livello di regolamento i segnalini potenziato/indebolito introdotti con la plancia giocatore, o tenerli come solo aiuto visivo da tavolo.
