# Mazzo Epico, Via murata, Sentiero battuto — testi (versione 3, da confermare)

Stato: SOLO BOZZA di design. Non è ancora nel gioco né nelle carte.
Aggiornamenti di questa versione: Via murata ora è Divinazione e Sentiero battuto è Essenza; la ricompensa del Custode segue la scala delle ricompense (+1 oggetto); testi senza segnaposto, pronti per la stampa.

## Regole di base
- **Mappa:** i 36 nodi partono VUOTI (nessun setup). Si mette una pedina sul nodo solo quando il piano viene visitato (lato davanti) o murato con Via murata (lato girato). Nodo occupato = piano visitato o murato. Un piano murato conta come visitato.
- Il **Piano Terreno non è tracciato sulla mappa stellare**: non ha nodo, quindi non può essere murato né conta per le famiglie.
- **Famiglia completata:** tutti i suoi nodi sono occupati. Demoniaco 3, Non-morti 3, Eterei 5, Elementare 7, Armonia 9, Entropia 9.
- **Il mazzo Piani non si rimescola mai con gli scarti.** Se un piano murato arriva in cima al mazzo (anche solo per un'anteprima), si scarta e si guarda la carta dopo.

## Quando scatta l'Epico
L'Epico **sostituisce l'Incontro del turno** (nessun turno in più) e **vince sul Generico** (che in quel turno salta).
1. **Famiglia completata.** Se l'ultima pedina arriva con un salto, l'Incontro di quel turno è Epico. Se la completa una Via murata, scatta al prossimo arrivo.
2. **Nuovo giro della scaletta.** Il 1° piano di ogni nuovo giro (16°, 31° salto…) ha Incontro Epico.
3. Se maturano due Epici insieme, si gioca il primo e il secondo scatta al prossimo arrivo.

## Parametri dell'Epico
Niente tabella per famiglia: tutto dipende dal **piano che sta uscendo**.
- **Caratteristica nativa** = il check del piano (Forza, Destrezza, Intelletto, PV, Sanità, Anima). Se il piano ha un check speciale (scelta, casuale, Forza o Intelletto) si risolve come fa già il gioco con `nativeStatFor`.
- Le carte Epico non nominano la famiglia: dicono «il piano in corso» e «la caratteristica nativa del piano». L'arte è quindi **neutra** (valida per qualunque famiglia).

## Ricompensa da boss (Epico)
Come la **scala delle ricompense** in base al valore del nemico, **più 1 oggetto extra**.
| Valore | Scala normale | Epico (+1 oggetto) |
|---|---|---|
| 5 | 2 oggetti + 2 permanenti | 3 oggetti + 2 permanenti |
| 4 | 1 oggetto + 1 permanente | **2 oggetti + 1 permanente** |
| 3 | 1 oggetto + 1 temporanea | 2 oggetti + 1 temporanea |
| 2 | 1 oggetto | 2 oggetti |
| 1 | 1 temporanea | 1 temporanea + 1 oggetto |
(Oggetti a chi ne ha meno; la caratteristica, la nativa del piano, a chi ha il valore più basso, a caso se pari.)

## Le due spell
### Via murata — scuola **Divinazione** (1 sola carta: il mazzo Divinazione passa da 6 a 7)
> **Via murata.** Costa 1 risorsa planare. Scegli un piano non ancora visitato (nodo vuoto sulla mappa) e mettici una pedina dal lato «murato»: il piano conta come visitato. Quando esce dal mazzo Piani lo scarti senza giocarlo e guardi la carta dopo. Non si usa su Stasi. Il Piano Terreno non è sulla mappa, quindi non si può murare.

### Sentiero battuto — scuola **Essenza** (1 sola carta: il mazzo Essenza passa da 13 a 14)
> **Sentiero battuto.** Si lancia appena arrivati su un piano, prima che faccia effetto. Se la sua famiglia ha già almeno un'altra pedina sulla mappa (visitata o murata), il primo danno subito da ciascun presente in questo piano è parato, come per il Cerchio di Protezione. Dura fino al prossimo salto.

## Mazzo Epico — 8 carte (un solo mazzo, un solo retro)
1. **Il Custode risvegliato** — *Incontro, persistente.* Scontro sulla caratteristica nativa del piano, valore nemico 4. Danno passante: oltre ai PV, -1 temporaneo alla caratteristica nativa. Da sconfitto serve un check di Destrezza di gruppo (valore più alto) per fuggire; se fallisce lo stesso Incontro torna e il turno si ripete. Sconfitto: ricompensa della scala per valore 4 più 1 oggetto extra (2 oggetti + 1 caratteristica permanente).
2. **L'Altare del portale** — *Scelta.* Ogni presente può offrire 1 risorsa planare oppure 1 oggetto non protetto e ottiene +1 permanente a una caratteristica a scelta (massimo 6). Una volta a testa.
3. **La Mappa stellare** — *Ricompensa.* Guardate le prime 3 carte del mazzo Piani e riordinatele (in cima o in fondo), come per il Terzo Occhio. Inoltre potete murare gratis un piano non visitato (come Via murata, senza costo).
4. **Eco del viaggio** — *Ricompensa.* Ogni presente recupera tutti i PV, +1 Sanità e +1 Anima (non oltre il massimo), ricarica la sua abilità di classe, perde tutte le caratteristiche temporanee (positive e negative) e ottiene 1 risorsa planare.
5. **Il Patto del portale** — *Scelta individuale.* Ogni presente sceglie: (a) +1 permanente a una caratteristica a scelta, ma perde subito 1 Anima (con il check contro la Corruzione); oppure (b) pesca 1 oggetto senza prezzo.
6. **La Fenditura** — *Check di gruppo sulla caratteristica nativa del piano* (vale il valore più alto, a -1, nessun reroll). Successo: pesca 1 oggetto e 1 spell. Fallimento: ogni presente subisce 1 danno ai PV.
7. **Il Banchetto dei dimenticati** — *Mercante.* Ogni presente può scambiare fino a 2 risorse planari: ogni risorsa = pesca 1 oggetto oppure 1 spell, a scelta.
8. **Il Lascito del primo viaggiatore** — *Ricompensa.* Pesca 3 carte da una scuola di spell a tua scelta: ne tieni 1, le altre vanno in fondo al mazzo.

Se il mazzo Epico finisce, si rimescolano gli scarti dell'Epico (sono pochi e rari).

## Decisioni prese
- Parametri dal piano che esce; Patto 1 Anima; Banchetto 2 scambi; Cartografia scartata.
- Ricompensa boss = scala + 1 oggetto. Via murata = Divinazione; Sentiero battuto = Essenza. Piano Terreno fuori dalla mappa.

## Componenti da produrre (dopo la conferma)
- 2 illustrazioni spell: `sp_viamurata`, `sp_sentierobattuto` (1696×2528, come le altre spell).
- 8 illustrazioni Epico: `ep_custode`, `ep_altare`, `ep_mappastellare`, `ep_eco`, `ep_patto`, `ep_fenditura`, `ep_banchetto`, `ep_lascito` (stesso formato degli Incontri).
- 1 retro: `retro_incontro_epico` (848×1264, dorso per il Mazzo Epico, poi nello slot del tabellone).
- Pedine mappa a due facce (visitato / murato): le disegno io via script, nessuna immagine da generare.
- Cornice/colore «Epico» per le carte: la preparo io (bianco-oro `#e7c988`, come sul tabellone).
