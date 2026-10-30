# Prompt per la mappa dei piani del tabellone

Due serie di immagini da generare. Poi le piazzo io sul tabellone (nebulose dietro ai cluster, emblemi nei nodi).
Stile di riferimento: allega ai generatori `assets/ui/tabellone_a2_basso.jpg` (o la nuova immagine bassa) come riferimento di stile.

## Regola d'oro
- **Sfondo nero puro (#000000), nessuna cornice, nessun testo.** Il nero lo rendo trasparente io (modo "screen"), quindi tutto ciò che è luminoso resta, il nero sparisce.
- Il disegno deve **sfumare nel nero prima dei bordi** dell'immagine (niente tagli netti).
- Quadrato 2048 × 2048 px per le nebulose; 1024 × 1024 px per ogni emblema.
- Niente persone, niente volti nitidi, niente scritte, lettere, numeri.

## Stile comune (da incollare all'inizio di ogni prompt)
> Dark fantasy painterly style, rich and luminous on a pure black background (#000000), soft glow, fine star dust, subtle brush texture, no frame, no border, no text, no letters, no numbers, no people, no faces. The artwork fades smoothly to pure black well before the edges of the image. Square 2048 x 2048 px.

## SERIE A — 6 nebulose-costellazione (una per famiglia)

**A1 · Elementare** (colore dominante #c1531f, famiglia fisica)
> [Stile comune] A vast elemental nebula in burnt orange and ember red: drifting embers and sparks, rivers of glowing lava light, wisps of steam, floating crystal shards, a faint stormy cloud edge with lightning, thin threads of cold teal water light and a hint of toxic green. Seven soft bright regions arranged like a constellation, with darker calmer gaps between them. Warm, volcanic, alive.

**A2 · Eterei** (#3a5aa8, famiglia dello spirito)
> [Stile comune] A dreamlike ethereal nebula in deep sapphire and moonlight blue: a soft aurora, drifting mirror shards, a halo of silver light on one side and an eclipse of darkness on the other, floating motes like constellation stars, veils of dream mist. Five soft bright regions arranged like a constellation. Calm, mystical, weightless.

**A3 · Armonia** (#b89323, ordine)
> [Stile comune] A golden nebula of order: radiant sacred geometry, concentric orbits and mandala rings made of light, balanced rays like a halo, fine golden dust drifting in symmetrical patterns, a gentle sun glow, subtle clockwork and crystalline lattice details. Nine soft bright regions arranged like an orderly constellation. Serene, luminous, perfectly balanced.

**A4 · Entropia** (#5f3f92, caos — opposta ad Armonia)
> [Stile comune] A violet and black nebula of chaos and decay: torn space with glowing cracks, dissolving ash, swirling storm of purple light, drifting fragments, faint crimson veins, a sense of time and matter unraveling. Nine soft bright regions arranged like a chaotic, irregular constellation. Unstable, hypnotic, ominous.

**A5 · Demoniaco** (#8f1f1f, 3 gironi infernali) — formato alto e stretto
> [Stile comune] A narrow vertical infernal nebula descending in three stages: crimson hellfire and embers at the top (gates of glowing coals), a deep chasm of flames in the middle, and cold blue-black abyssal frost at the bottom. Three soft bright regions arranged in a vertical chain. Hot, menacing, descending.

**A6 · Non-morti** (#3d5c40, Piano Negativo — 3 livelli) — formato alto e stretto
> [Stile comune] A narrow vertical necrotic nebula in sickly green and bone-white: ghostly mist, spectral wisps, a drowned swamp glow at the top, a veil of whispering ghost light in the middle, a black-hole vortex of negative energy at the bottom. Three soft bright regions arranged in a vertical chain. Cold, haunting, silent.

(A5 e A6: se il generatore lo permette, formato 1024 × 2048; altrimenti quadrato va bene.)

## SERIE B — 36 emblemi dei piani (facoltativa, bellissima ma non indispensabile)
Un emblema per piano, medaglia circolare, da mettere dentro ogni nodo: il segnalino ci va sopra, quindi l'emblema si scopre quando il piano non è ancora uscito. Genera una famiglia alla volta, **in un foglio con una riga di medaglie** (così hanno stile uguale).

**Prompt modello**
> [Stile comune, ma 1024 px di altezza per medaglia] A single horizontal row of N circular engraved medallions on a pure black background, evenly spaced, identical size, identical style: dark enamel disc with a thin metallic rim in COLOR, and a glowing engraved symbol in the center. Each medallion shows ONE symbol: ELENCO. Consistent line weight, soft inner glow in COLOR, no text, no letters.

**Elenco simboli per famiglia**
- **Elementare** (N=7, colore arancio/rame): Fuoco = fiamma · Veleno = goccia con teschietto · Acqua = onda · Terra = montagna/roccia · Aria = vortice di vento · Tempesta = fulmine su nuvola · Cristallo = cristallo sfaccettato
- **Eterei** (N=5, colore blu zaffiro): Luce = stella radiosa · Tenebre = eclissi · Sogno = luna con stelle · Specchi = specchio con riflesso doppio · Astrale = spirale di stelle
- **Armonia** (N=9, colore oro): Ordine = reticolo simmetrico · Legge = bilancia/tavola · Sacro = aureola/fiamma sacra · Stasi = clessidra ferma · Sole = sole · Metallo = ingranaggio/incudine · Logica = triangolo con ingranaggi/circuito · Verità = lanterna/occhio aperto · Eternità = infinito/ouroboros
- **Entropia** (N=9, colore viola): Caos = frecce a spirale scomposte · Vuoto = anello vuoto · Sangue = goccia di sangue · Decadimento = foglia che si sbriciola · Putrefazione = spore/muffa · Tempo = orologio spezzato · Cenere = albero bruciato/fiocchi di cenere · Oblio = sagoma che svanisce (senza volto) · Ombra = ombra senza figura
- **Demoniaco** (N=3, colore rosso): Porte di Brace = portale con braci · Baratro in Fiamme = abisso con fiamme · Gelo dell'Abisso = teschio cornuto di ghiaccio
- **Non-morti** (N=3, colore verde spettrale): Palude Sconsacrata = palude con croce che affonda · Velo dei Sussurri = velo con spiriti · Voragine della Negatività = vortice nero

## Cosa mi mandi
- Nebulose: `nebulosa_elementare.jpg`, `nebulosa_eterei.jpg`, `nebulosa_armonia.jpg`, `nebulosa_entropia.jpg`, `nebulosa_demoniaco.jpg`, `nebulosa_nonmorti.jpg`
- Emblemi (se li fai): `emblemi_elementare.jpg`, `emblemi_eterei.jpg`, ecc. (una riga per famiglia)
- Le lascio nella cartella del progetto, come sempre.

## SFONDI DEL TABELLONE (i due grandi: metà alta e metà bassa)
Immagine **2480 × 1771 px** (rapporto 1,40 = 406 × 290mm). Con ogni prompt allega la guida corrispondente (`tabellone_guida_alto.png` / `tabellone_guida_basso.png`, si rigenerano con `node render-guida-a2.js`) scrivendo: *"use this layout only as composition reference: keep the dashed zones dark and calm; do not draw the dashes, boxes or any text"*.
Le due metà devono avere lo stesso stile e lo stesso colore del bordo aperto (#0b0f1e): generale con lo stesso seed, o allega la prima come riferimento di stile per la seconda.

### Metà ALTA (carte)
> Wide fantasy tabletop game mat background, landscape, exactly 2480 x 1771 px (aspect ratio 1.40). A dark ancient stone chamber seen straight-on, flat top-down feel, with a faint swirling cosmic portal in the very center. A THIN ornate Celtic-knot border runs along the top, left and right edges only, about 86 px wide (3.5% of the width), silver and old gold, with small plain corner knots. The BOTTOM edge has NO border: the image fades smoothly into very dark midnight blue (#0b0f1e). The whole interior must be calm, dark and low-contrast (deep navy, charcoal, hints of violet), with soft stone texture and subtle star dust, so that playing cards laid on top read clearly. Put any bright details, candles, runes and ornaments ONLY in a narrow band of about 100 px just inside the border, never in the central area. Keep the vertical strip from x = 1197 to x = 1283 px free of high-contrast detail. NO card slots, NO rectangles, NO frames inside, NO boxes, NO text, NO letters, NO numbers, NO characters, NO watermark.

### Metà BASSA (mappa)
> Wide fantasy tabletop game mat background, landscape, exactly 2480 x 1771 px (aspect ratio 1.40). A vast deep-space void in dark navy and violet with a gigantic soft spiral galaxy / portal vortex whose center sits slightly below the middle of the image, painterly, with scattered stars and faint star dust, calm and dark overall so that glowing map markers added later will read clearly. A THIN ornate Celtic-knot border runs along the bottom, left and right edges only, about 86 px wide, silver and old gold, with small plain corner knots. The TOP edge has NO border: the image fades smoothly into very dark midnight blue (#0b0f1e), identical in color and texture to the top image's bottom edge. Keep the vertical strip from x = 1197 to x = 1283 px free of high-contrast detail. NO circles, NO node markers, NO constellations, NO card slots, NO rectangles, NO text, NO letters, NO numbers, NO characters, NO watermark.

## ALTERNATIVA CONSIGLIATA: UN SOLO SFONDO (cornice identica ovunque)
Se con due prompt separati i bordi vengono diversi, genera **un'unica immagine verticale 1736 × 2480 px** (rapporto 7:10 = 406 × 580mm, tutto il tabellone montato). Allega `tabellone_guida_unica.png` (si rigenera con `node render-guida-a2.js`) come riferimento di composizione. Poi la taglio io in due metà (alta e bassa) per i 4 fogli: la cornice è una sola, quindi combacia per forza.

> Tall fantasy tabletop game mat background, portrait, exactly 1736 x 2480 px (aspect ratio 7:10). One continuous scene: a vast dark ancient stone sanctuary seen straight-on, flat top-down feel, with a huge swirling cosmic portal vortex centered slightly below the middle of the image, painterly, deep navy, charcoal and violet, subtle star dust and soft stone texture. A THIN ornate Celtic-knot border runs along ALL FOUR edges, the same silver and old gold everywhere, about 60 px wide (3.5% of the width), with small plain corner knots and one small diamond ornament at the middle of each side. The whole interior must be calm, dark and low-contrast so that playing cards and glowing map markers laid on top read clearly; put any bright details, candles, runes and ornaments ONLY in a narrow band of about 70 px just inside the border, never in the central area. Keep a horizontal band across the middle (y = 1200 to 1290 px) and a vertical strip in the middle (x = 820 to 916 px) free of high-contrast detail and free of any border. NO card slots, NO rectangles, NO frames inside, NO circles, NO node markers, NO constellations, NO boxes, NO text, NO letters, NO numbers, NO characters, NO watermark.

(Con questa immagine la fascia tratteggiata a metà è dove tagliamo; il resto delle istruzioni — nebulose e emblemi — non cambia.)

## SFONDO UNICO — versione "stessa grafica delle due metà" (consigliata)
Un'unica immagine **1736 × 2480 px** (7:10 = 406 × 580mm). Allega come riferimento di stile **le due immagini che già ti piacciono** (`meta alta.jpg` = stanza di pietra in alto, `meta bassa.jpg` = nebulosa in fondo, sono in `assets/ui/tabellone_a2_alto.jpg` e `tabellone_a2_basso.jpg`) e, per la composizione, `tabellone_guida_unica.png`. Una sola cornice, quindi i bordi sono per forza uguali.

> Tall fantasy tabletop game mat background, portrait, exactly 1736 x 2480 px (aspect ratio 7:10), ONE continuous painterly scene that gradually changes from top to bottom, in the same style as the two reference images. UPPER HALF (y 0 to 1240 px): a dark ancient stone sanctuary seen straight-on, flat top-down feel, cracked stone floor in deep navy and charcoal, a worn stone slab frame just inside the border with a few softly glowing blue runes along it and small clusters of lit candles ONLY in the four corners of this half, a faint dim swirling portal in the middle of the stone floor. The stone floor, the runes and the candles dissolve smoothly and completely into deep midnight blue (#0b0f1e) around y = 1150 to 1300 px, leaving no hard line. LOWER HALF (y 1240 to 2480 px): a vast deep-space void in dark navy and violet with a GIANT SOFT SPIRAL GALAXY / NEBULA VORTEX, painterly, with scattered stars, faint star dust and soft violet-blue cloud swirls; the vortex center sits at about y = 1800 px, horizontally centered, large (about 900 px wide), calm and not too bright, with distant soft nebula glows on the far left and far right; the area around the top of this half is plain dark midnight blue. BORDER: one single thin ornate Celtic-knot braid frame running continuously along ALL FOUR edges of the whole image, exactly the same pattern, thickness (about 60 px) and silver-and-old-gold color on every side from top to bottom, with identical plain Celtic knot corner pieces at the four corners and a small diamond ornament at the middle of each of the four sides. Both halves must stay calm, dark and low-contrast in the central areas so that cards and glowing map markers placed on top read clearly: bright details only in the narrow band just inside the border. Keep a horizontal band across the middle of the image (y = 1200 to 1290 px) and a vertical strip in the middle (x = 820 to 916 px) free of high-contrast detail. NO card slots, NO rectangles, NO boxes, NO frames inside, NO circles, NO node markers, NO constellations, NO text, NO letters, NO numbers, NO characters, NO watermark.

**Consigli per ottenere un risultato fedele**
- Se il generatore ha il campo "image reference / style reference" usa le due immagini attuali con peso alto (circa 0,7) e la guida con peso basso (circa 0,3).
- Se la nebulosa in fondo viene troppo luminosa o troppo piccola, aggiungi: *"the nebula vortex is the main subject of the lower half, large, centered, dim and atmospheric"*.
- Se il bordo ha pezzi diversi tra metà alta e bassa, rigenera con più peso al riferimento del bordo o con la frase: *"the Celtic braid border is one single continuous strip, copy-pasted identically on all four sides"*.
- Se esce con un rapporto diverso da 7:10, va bene qualsiasi immagine con quel rapporto, la scalo io; meglio se almeno 1600 px di larghezza.

## SFONDO UNICO ALLARGATO (tabellone 616 × 580 mm con il percorso dei salti a destra)
Immagine **2560 × 2410 px** (rapporto 1,062 = 616 × 580 mm), UNA sola cornice celtica argento su tutti e quattro i lati, stesso stile e stessa palette del tabellone unico attuale (`assets/ui/tabellone_unico.jpg`, da allegare come riferimento di stile). Con il prompt allega la guida `tabellone_guida_616x580.png` (le linee azzurre puntinate sono il filo di luce, i tratteggi dorati sono le zone-carta e gli archi) scrivendo: *"use this layout only as composition reference: keep the dashed zones calm and dark; do not draw the dashes, boxes or any text"*.
- **Sinistra (circa i primi due terzi): come il tabellone di prima.** Stanza di pietra in alto con candele e rune sul muro; zona centrale scura e calma per i mazzi e le carte; in basso la nebulosa spirale dove stanno le costellazioni.
- **Destra (ultimo terzo): fascia del percorso, con il senso del viaggio.** Qui ci vanno 3 colonne da 5 carte, che coprono quasi tutta la fascia: l'arte va quindi SOLO negli spazi liberi (vedi la guida):
  - **Un filo di luce** (scia di polvere di stelle azzurro-argento, sottile ma luminoso) che corre nella striscia in alto, nei 4 interspazi verticali fra le colonne e nella striscia in basso, come il cammino che lega i salti.
  - **Tre archi di pietra** (portali) in cima alle tre colonne, sempre piu' luminosi: il primo spento e freddo, il secondo piu' vivo, il terzo con un chiaro bagliore. Niente simboli o scritte sugli archi.
  - **Una porta di luce calda** (oro) in basso, sotto la colonna centrale: la Via di Casa.
  - **Caselle come nicchie:** il fondo di ogni casella da carta e' una leggera nicchia/gradino di pietra incisa, visibile quando e' vuota. Le caselle della riga in fondo a ogni colonna (salti 5, 10, 15) hanno un anello-portale inciso piu' marcato.
  - **Tocco di colore per colonna:** il fondo della colonna 1 blu freddo, della 2 viola piu' profondo, della 3 oro caldo, in modo molto sottile (come l'avvicinarsi all'uscita). Restano coerenti con la palette del resto del tabellone.
  - Nessun numero, lettera o simbolo nell'immagine (i numeri li stampo io). Nessuna nebulosa forte: sfondo calmo, scuro, leggibile.
- **Cornice:** unica e continua attorno a tutto, nodi celtici agli angoli, nessuna cornice interna.
- Niente testo, lettere, numeri, personaggi. Margine di 7mm di cornice sul bordo (la stampante non arriva al bordo).

### PROMPT COMPLETO (da incollare cosi' com'e', in inglese)
> Wide tabletop game mat background, landscape-ish, exactly 2560 x 2410 px (aspect ratio 1.062), ONE continuous painterly scene with ONE single silver Celtic-knot border around the whole image, in the same style as the reference images. The image has two parts side by side: a LEFT PART (x 0 to 1690 px) and a RIGHT PART (x 1700 to 2560 px), separated only by a very faint thin golden vertical line at x = 1695 px.
>
> LEFT PART: UPPER HALF (y 0 to 1205 px): a dark ancient stone sanctuary seen straight-on, flat top-down feel, cracked stone floor in deep navy and charcoal, a worn stone slab frame just inside the border with a few softly glowing blue runes along it and small clusters of lit candles ONLY in the two top corners, a faint dim swirling portal in the middle of the stone floor. The stone floor, runes and candles dissolve smoothly and completely into deep midnight blue (#0b0f1e) around y = 1120 to 1260 px, leaving no hard line. LOWER HALF (y 1205 to 2410 px): a vast deep-space void in dark navy and violet with a GIANT SOFT SPIRAL GALAXY / NEBULA VORTEX, painterly, scattered stars, faint star dust and soft violet-blue cloud swirls; the vortex center at about x = 845, y = 1750, large (about 900 px wide), calm and not too bright, with distant soft nebula glows on the far left and far right of this part; the area around the top of this half is plain dark midnight blue. Keep a horizontal band across the middle (y = 1170 to 1260 px) free of high-contrast detail.
>
> RIGHT PART (x 1700 to 2560 px): a calm, dark, readable strip of the same deep navy and stone texture, with a gentle sense of a JOURNEY. Three columns of equal width. At the top of each column a carved stone portal arch (about 130 px tall, no symbols, no text): the first arch cold, dim and unlit, the second more alive with a soft glow, the third with a clear warm bright glow. A thin luminous thread of silver-blue star dust runs only in the narrow free spaces: along the top strip below the arches, down the four thin vertical gaps between and beside the columns, and along the bottom strip, linking everything like a path. At the bottom, centered under the middle column, a doorway of warm golden light (the way home). The background of each column has a very subtle tint: column 1 cold blue, column 2 deeper violet, column 3 warm gold, as if approaching the exit. Under where cards will lie, the floor looks like softly carved stone niches / stepping stones, with a more marked engraved ring at the bottom slot of each column. No strong nebulae, no bright details in this strip except the arches, the thread and the golden doorway.
>
> BORDER: one single thin ornate Celtic-knot braid frame running continuously along ALL FOUR edges of the whole image, same pattern, thickness (about 60 px) and silver-and-old-gold color on every side, identical plain Celtic knot corner pieces at the four corners and a small diamond ornament at the middle of each of the four sides. Central areas stay calm, dark and low-contrast so that cards and glowing map markers placed on top read clearly. NO card slots, NO rectangles, NO boxes, NO inner frames, NO circles, NO node markers, NO constellations, NO text, NO letters, NO numbers, NO characters, NO watermark.

**Allegati:** `tabellone_unico.jpg` (riferimento di stile, peso alto ~0,7) + `tabellone_guida_616x580.png` (composizione, peso basso ~0,3, con la frase: *"use this layout only as composition reference: keep the dashed zones calm and dark; do not draw the dashes, boxes or any text"*).
