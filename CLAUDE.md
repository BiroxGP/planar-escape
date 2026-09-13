# Planar Escape (ex "Piani in Fuga")

Gioco da tavolo cooperativo-competitivo originale, ideato da Gabriele. Un party fugge attraverso un portale imprevedibile da un'entità troppo forte per loro, e finisce a saltare a caso tra decine di piani dimensionali (elementali, demoniaco, non-morti, eterei, Armonia, Entropia...) cercando di tornare a casa. Cooperativo nel percorso, individuale nella vittoria: non serve che torni tutto il gruppo, vincono i singoli personaggi che ce la fanno.

Il documento di design completo e "vivo" (tutte le regole, in continua evoluzione) è pubblicato qui e resta la fonte di verità per qualunque dubbio di regolamento:
https://claude.ai/code/artifact/15cb97ae-c305-4102-8e31-8a8ae333b2d5

Questo repository contiene un **prototipo web giocabile** di quelle regole, per fare playtest reali col gruppo prima di finalizzare tutto su carte fisiche.

## Stato del progetto

- `index.html` — l'intera app: un unico file HTML+CSS+JS vanilla, nessun framework, nessun build step. Si apre col doppio click / si serve così com'è.
- `CARDS_MANIFEST.md` — elenco di tutti i nomi file immagine che l'app cercherà (`assets/cards/<id>.png`, `assets/classes/<classe>.png`). Le immagini vere arriveranno in seguito da un altro strumento di generazione: finché non esistono, l'app mostra automaticamente un segnaposto colorato con emoji + nome carta (nessun errore, nessuna immagine rotta visibile).
- Cartella `assets/cards/` (e da creare `assets/classes/`) — dove andranno le immagini quando pronte, con i nomi file esatti indicati nel manifest.

**Importante:** questo stesso progetto viene anche sviluppato in parallelo da una sessione Claude "Cowork" nel cloud, collegata a questa identica cartella sul PC di Gabriele — può aver modificato `index.html` fuori da una sessione di Claude Code. All'avvio, non fidarti della memoria di una sessione precedente: rileggi `index.html` da disco prima di ragionare sulla sua struttura o di proporre modifiche.

## Architettura di `index.html`

Un solo `<script>` con queste sezioni, in ordine:

1. **Dati di gioco** (costanti, non toccare la forma senza motivo): `CLASSES` (13 classi), `FAMILIES` (7 famiglie di piano), `PIANI` (36 carte del mazzo Piani, incluse le 3+3 carte a gironi/livelli di Demoniaco e Piano Negativo), `INCONTRI` (98 carte su 7 sotto-mazzi: elementare, demoni, nonmorti, eterei, armonia, entropia, generico), `OGGETTI` (60 carte), `SPELLS` (31 carte su 3 scuole: flusso, essenza, divinazione), `PIANO_TERRENO` (12 destinazioni finali, pescate senza reinserimento).
2. **Stato di gioco**: un solo oggetto globale `state` (mazzi, party, log, salto corrente) creato da `newGame()`.
3. **Motore regole**: check con d6 (`checkRoll`), Contese/combattimento ad accumulo (`fightRound`, `fightRoundGeneric`, `resolveAutoCombat`), depotenziamenti temporanei/permanenti con floor (`applyTempDebuff`, `applyPermDebuff` — tutte le caratteristiche hanno floor 1 tranne i Punti Vita che vanno a 0/sotto0), Resistenza (blocco primo danno per ingresso di piano, `checkResistanceBlocks`/`resetResistanceForPlane`), Follia/Corruzione (`triggerFollia`, `triggerCorruzione`), Recupero (`recuperoFor`), progressione ogni 5 salti (`checkLevelUp`).
4. **Render/UI**: funzioni `render*` che rigenerano l'HTML da zero da `state` a ogni cambiamento (pattern semplice tipo "immediate mode", niente virtual DOM), più i relativi `bind*` che riattaccano gli event listener dopo ogni render.

### Convenzione chiave: carte "manuali"

Molte delle ~200 carte hanno un effetto molto narrativo/specifico da applicare a discrezione del tavolo (es. baratti, scelte libere, effetti unici). Queste sono marcate `manual:true` nei dati: l'app mostra il testo esatto della carta e un pannello con pulsanti generici (danno, depotenziamento temp/perm, perdi/ottieni oggetto, +1 risorsa, cura) invece di provare a indovinare l'effetto esatto. **Non eliminare questo pattern**: è una scelta di design deliberata, non un difetto da "completare" — semplifica moltissimo il codice pur restando giocabile al 100%.

### Convenzione immagini

`cardArt(id, icon, name, famClass)` genera un `<img src="assets/cards/<id>.png" onerror="...">` con fallback automatico a un div colorato con emoji+nome se il file non esiste. Qualunque nuova carta va sempre referenziata con lo stesso `id` usato nei dati, che deve combaciare col nome file nel manifest.

## Testing già fatto

In una sessione precedente (Cowork) è stata verificata l'intera app con Playwright headless: tutti i 36 piani, tutte le 98 carte Incontro, gestione oggetti/spell/reroll/recupero, salvataggio/caricamento — **zero errori JavaScript**. Gli script di test erano scratch (non salvati nel repo). Se tocchi la logica del motore, vale la pena riscrivere test simili (Playwright + Chromium, forzando `state.currentDraw`/`state.mazzoPiani` via `page.evaluate` per testare ogni carta deterministicamente) prima di considerare la modifica sicura.

## Semplificazioni note (non bug, ma limiti consapevoli del v0.1)

- Distribuzione del danno del team sulle entità multiple: sempre focus-fire sulla entità con meno PV residui (non è negoziabile dai giocatori nell'interfaccia).
- Danno in eccesso delle entità verso i personaggi: distribuito round-robin, non scelto dal gruppo.
- Carte con check "a scelta" (Specchi, Frammento di sé, Doppio specchiato) semplificate a un default (For) nel loop di combattimento automatico invece di lasciare scegliere per ogni round.
- Equipaggiamento armi/armature: uno slot per tipo, nessun controllo incrociato scudo+arma a due mani.
- Molti effetti "ongoing fino al prossimo salto" (es. Sfera Antiplanare, Cerchio di Protezione, Sigillo) sono loggati ma non tracciati come stato persistente da un turno all'altro: vanno tenuti a mente dal tavolo.

## Task immediato di questa sessione

Gabriele vuole collegare questo progetto a GitHub e Vercel esattamente come fa già per i suoi altri progetti locali (di solito lascia fare tutto a Claude Code via PowerShell). Quindi, se non diversamente specificato nel messaggio che segue:

1. Inizializza git in questa cartella (se non già fatto).
2. Crea una repo GitHub **privata** chiamata `planar-escape` e fai il push iniziale.
3. Collegala a Vercel come sito statico — `index.html` è l'entry point, **nessun build step**, nessun framework.
4. Conferma alla fine URL della repo e URL del deploy Vercel.

## Come continuare a lavorarci dopo

Il ciclo naturale è: Gabriele discute modifiche di design/regole nella chat Cowork nel cloud (che ha accesso diretto a questa stessa cartella) oppure qui in Claude Code — in entrambi i casi si edita lo stesso `index.html`. Dopo modifiche fatte da qui, ricordati di fare commit+push se il repo è già collegato. Comunica sempre in italiano, come nel resto del progetto.
