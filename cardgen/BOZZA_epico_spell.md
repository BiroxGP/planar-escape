# Bozza — Mazzo Epico, Via murata, Sentiero battuto (da confermare)

Stato: SOLO BOZZA di design. Niente di questo è nel gioco né nelle carte finché non viene confermato.
Immagini/componenti da generare: solo dopo la conferma (vedi in fondo).

## Regole di base
- **Mappa:** i 36 nodi partono VUOTI (niente setup). Si mette una pedina sul nodo solo quando il piano viene visitato (lato davanti) o murato con Via murata (lato girato). Nodo occupato = piano visitato o murato; un piano murato conta come visitato.
- **Famiglia completata:** tutti i suoi nodi sono occupati (visitati o murati). Demoniaco 3, Non-morti 3, Eterei 5, Elementare 7, Armonia 9, Entropia 9.
- **Il mazzo Piani non si rimescola mai con gli scarti** (già nel gioco). Un piano murato che arriva in cima al mazzo — anche solo per un'anteprima o una sbirciata — si scarta subito e si guarda la carta successiva.

## Quando scatta l'Epico
L'Epico **sostituisce l'Incontro del turno** (nessun turno in più) e **vince sul Generico**.
1. **Famiglia completata.** Se l'ultima pedina la mette un arrivo, l'Incontro di quel turno è Epico, con quella famiglia come [F]. Se la completa una Via murata, l'Epico scatta al prossimo arrivo.
2. **Nuovo giro della scaletta.** Il 1° piano di ogni nuovo giro (16°, 31° salto…): l'Incontro è Epico, con la famiglia del piano d'arrivo come [F].
Se due Epici maturano insieme, si gioca il primo e il secondo scatta al prossimo arrivo.

## Parametri dell'Epico (CONFERMATO: li dà il piano)
Niente tabella per famiglia: i parametri vengono dal **piano che sta uscendo** (quello d'arrivo che innesca l'Epico).
- **[F]** = famiglia di quel piano.
- **[S]** = la caratteristica nativa di quel piano (il suo check: Forza, Destrezza, Intelletto, PV, Sanità, Anima). Se il piano ha un check speciale (scelta, casuale, Forza o Intelletto) si applica lo stesso meccanismo del piano, come già fanno gli Incontri con check «nativo».
- **[T]** = tipo della famiglia (Elementare = Fisico, tutte le altre = Etereo).
- Se l'Epico scatta perché una Via murata ha completato una famiglia, si usa il piano del prossimo arrivo.

- **Ricompensa da boss** (valore nemico >= 3): **Fisico** -> oggetti dal mazzo Oggetti. **Etereo** -> **+1 permanente** a [S] per chi ha il valore più basso (se pari, tutti i pari).

## Le due spell
### Via murata — scuola Essenza (1 sola carta, il mazzo Essenza passa da 13 a 14)
> **Via murata.** Costa 1 risorsa planare. Scegli un piano non ancora visitato (nodo vuoto sulla mappa) e mettici una pedina dal lato «murato». Il piano conta come visitato. Quando esce dal mazzo Piani lo scarti senza giocarlo e guardi la carta successiva. Non si può usare su Stasi, né sul Piano Terreno.

### Sentiero battuto — scuola Divinazione (1 sola carta, il mazzo Divinazione passa da 6 a 7)
> **Sentiero battuto.** Si lancia appena arrivati su un piano, prima che faccia effetto. Se la sua famiglia ha già almeno un'altra pedina sulla mappa (visitata o murata), il primo danno subito da ciascun presente in questo piano è parato, come per il Cerchio di Protezione. Dura fino al prossimo salto.

## Mazzo Epico — 8 carte (un mazzo unico, retro a parte)
[F] = famiglia, [S] = caratteristica, [T] = tipo, dalla tabella sopra.

1. **Il Custode di [F]** — *Incontro, persistente.* Scontro su [S], valore nemico 4; danno passante: oltre ai PV, anche -1 temporaneo a [S]. Se sconfitto e superato il check di fuga: ricompensa da boss.
2. **L'Altare di [F]** — *Scelta.* Ogni presente può offrire 1 risorsa planare oppure 1 oggetto non protetto: ottiene +1 permanente a una caratteristica a scelta (massimo 6). Una sola volta a testa.
3. **La Mappa stellare** — *Ricompensa.* Il gruppo guarda le prime 3 carte del mazzo Piani e le riordina (in cima o in fondo), come per il Terzo Occhio. Inoltre può murare gratis una via.
4. **Eco del viaggio** — *Ricompensa.* Ogni presente recupera tutti i PV, +1 Sanità e +1 Anima (non oltre il massimo), la sua abilità di classe si ricarica, guarisce tutti i depotenziamenti temporanei e ottiene 1 risorsa planare.
5. **Il Patto del portale** — *Scelta individuale.* Ogni presente sceglie: (a) +1 permanente a una caratteristica a scelta, ma perde subito 1 Anima (con il check contro la Corruzione); oppure (b) pesca 1 oggetto, senza prezzo.
6. **La Fenditura di [F]** — *Check di gruppo su [S]* (vale il valore più alto, a -1, nessun reroll). Successo: pesca 1 oggetto e 1 spell. Fallimento: ogni presente subisce 1 danno ai PV.
7. **Il Banchetto dei dimenticati** — *Mercante.* Ogni presente può scambiare fino a 2 risorse planari: 1 risorsa = pesca 1 oggetto oppure 1 spell, a scelta.
8. **Il Lascito del primo viaggiatore** — *Ricompensa.* Pesca 3 carte da una scuola di spell a tua scelta: ne tieni 1, le altre vanno in fondo al mazzo.

Se il mazzo Epico finisce, si rimescolano gli scarti dell'Epico (sono pochi e rari).

## Decisioni prese
- Parametri [S]/[T]/[F] dal piano che esce (niente tabella).
- Patto del portale: 1 Anima va bene.
- Banchetto: 2 scambi a testa vanno bene.
- Cartografia: scartata (il tabellone mostra già quanti piani mancano).
